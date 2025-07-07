'use strict';
'require form';
'require view';
'require uci';
'require poll';
'require tools.nikki as nikki';

function renderStatus(running) {
    return updateStatus(
        E('input', {
            id: 'core_status',
            style: 'border: unset; font-style: italic; font-weight: bold;',
            readonly: ''
        }),
        running
    );
}

function updateStatus(element, running) {
    if (element) {
        element.style.color = running ? 'green' : 'red';
        element.value = running ? _('Running') : _('Not Running');
    }
    return element;
}

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            nikki.version(),
            nikki.status(),
            nikki.listProfiles()
        ]);
    },
    render: function (data) {
        // Ambil data dari UCI dan hasil RPC
        const subscriptions = uci.sections('nikki', 'subscription');
        const appVersion = (data[1] && data[1].app) || '';
        const coreVersion = (data[1] && data[1].core) || '';
        const running = data[2] !== undefined ? data[2] : false;
        const profiles = data[3] !== undefined ? data[3] : [];

        let m, s, o;

        m = new form.Map('nikki');

        // 📊 Status Section
        s = m.section(form.TableSection, 'status', _('📊 Status'));
        s.anonymous = true;

        o = s.option(form.DummyValue, '_app_version', _('App Version'));
        
        o.rawhtml = true;
        o.readonly = true;
        
        o.load = () => {
            // Ambil main version & suffix: { main: "1.23.2", suffix: "-Mod-r1" }
            const extractVersion = (full) => {
                const m = full.match(/v?(\d+\.\d+\.\d+)(-.+)?/);
                return m ? { main: m[1], suffix: m[2] || "" } : { main: full, suffix: "" };
            };
        
            // Hilangkan 'v' jika ada
            const normalizeVersion = (vObj) => {
                return {
                    main: vObj.main.replace(/^v/, ''),
                    suffix: vObj.suffix
                };
            };
        
            // Bandingkan versi semver + suffix rX jika ada
            const compareVersions = (a, b) => {
                // a & b: { main, suffix }
                const pa = a.main.split('.').map(Number);
                const pb = b.main.split('.').map(Number);
                for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                    const na = pa[i] || 0;
                    const nb = pb[i] || 0;
                    if (na > nb) return 1;
                    if (na < nb) return -1;
                }
                // Jika main sama, cek suffix (misal -Mod-r2 vs -Mod-r1)
                if (a.suffix !== b.suffix) {
                    // Ambil angka rX di suffix (hanya jika ada -rX)
                    const ra = (a.suffix.match(/r(\d+)/) || [0,0])[1];
                    const rb = (b.suffix.match(/r(\d+)/) || [0,0])[1];
                    if (+ra > +rb) return 1;
                    if (+ra < +rb) return -1;
                    // Jika ingin membandingkan bagian lain dari suffix, bisa tambah logika di sini
                }
                return 0;
            };
        
            setTimeout(() => {
                const currentVersionRaw = extractVersion(appVersion || "unknown");
                const currentVersion = normalizeVersion(currentVersionRaw);

                fetch('https://api.github.com/repos/rivandraa/nikki_tproxy/releases/latest')
                    .then(response => response.json())
                    .then(data => {
                        const latestVersionRaw = extractVersion(data.tag_name || "");
                        const latestVersion = normalizeVersion(latestVersionRaw);
        
                        // Debug log
                        console.log("Current Version:", currentVersion);
                        console.log("Latest Version:", latestVersion);
                        console.log("compareVersions result:", compareVersions(latestVersion, currentVersion));
        
                        // Tampilkan notifikasi hanya jika ada versi lebih baru
                        if (
                            latestVersion.main &&
                            compareVersions(latestVersion, currentVersion) > 0
                        ) {
                            let container = document.getElementById('nikki-notification-container');
                            if (!container) {
                                container = document.createElement('div');
                                container.id = 'nikki-notification-container';
                                container.style.cssText = `
                                    position: fixed;
                                    top: 20px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    z-index: 9999;
                                `;
                                document.body.appendChild(container);
                            }
        
                            const notif = document.createElement('div');
                            notif.style.cssText = `
                                background-color: #ffcc00;
                                color: #000;
                                padding: 10px 15px;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                                font-weight: bold;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                white-space: nowrap;
                            `;
        
                            notif.innerHTML = `
                                <span>
                                    New version available: 
                                    <a href="https://t.me/NikkiTProxy" target="_blank" style="color: blue;">
                                        ${data.tag_name}
                                    </a>
                                </span>
                                <span style="cursor: pointer; color: red; font-weight: bold;" onclick="this.parentElement.remove();">❌</span>
                            `;
        
                            container.appendChild(notif);
                            setTimeout(() => notif.remove(), 10000);
                        }
                    })
                    .catch(err => {
                        console.warn("Gagal memeriksa versi terbaru (non-blocking):", err);
                    });
            }, 100);
        
            // Tampilkan versi saat ini (link ke rilis)
            return Promise.resolve(
                `<a href="https://t.me/NikkiTProxy" target="_blank">${appVersion}</a>`
            );
        };
        o.write = () => {};

        o = s.option(form.DummyValue, '_core_version', _('Core Version'));
        o.readonly = true;
        o.load = () => coreVersion;
        o.write = () => { };

        // --- Core Status (menampilkan status aktif/tidaknya service)
        o = s.option(form.DummyValue, '_core_status', _('Core Status'));
        o.cfgvalue = () => renderStatus(running);
        poll.add(function () {
            return L.resolveDefault(nikki.status()).then(function (running) {
                updateStatus(document.getElementById('core_status'), running);
            });
        });

        // 🔘 Control Buttons
        o = s.option(form.Button, 'reload');
        o.inputstyle = 'action';
        o.inputtitle = _('Reload Service');
        o.onclick = () => nikki.reload();

        o = s.option(form.Button, 'restart');
        o.inputstyle = 'negative';
        o.inputtitle = _('Restart Service');
        o.onclick = () => nikki.restart();

        o = s.option(form.Button, 'update_dashboard');
        o.inputstyle = 'positive';
        o.inputtitle = _('Update Dashboard');
        o.onclick = () => nikki.updateDashboard();

        o = s.option(form.Button, 'open_dashboard');
        o.inputtitle = _('Open Dashboard');
        o.onclick = () => nikki.openDashboard();

        s = m.section(form.NamedSection, 'config', 'config', _('⚙️ App Config'));

        // (isi konfigurasi app dilakukan di bagian render utama sebelumnya)
        o = s.option(form.Flag, 'enabled', _('Enable'));
        o.rmempty = false;

        o = s.option(form.ListValue, 'profile', _('Choose Profile'));
        o.optional = true;

        for (const profile of profiles) {
            o.value('file:' + profile.name, _('File:') + profile.name);
        }

        for (const subscription of subscriptions) {
            o.value('subscription:' + subscription['.name'], _('Subscription:') + subscription.name);
        }

        o = s.option(form.Value, 'start_delay', _('Start Delay'));
        o.datatype = 'uinteger';
        o.placeholder = '0';

        o = s.option(form.Flag, 'scheduled_restart', _('Scheduled Restart'));
        o.rmempty = false;

        o = s.option(form.Value, 'cron_expression', _('Cron Expression'));
        o.retain = true;
        o.rmempty = false;
        o.depends('scheduled_restart', '1');

        o = s.option(form.Flag, 'test_profile', _('Test Profile'));
        o.rmempty = false;

        o = s.option(form.Flag, 'fast_reload', _('Fast Reload'));
        o.rmempty = false;

        o = s.option(form.Flag, 'core_only', _('Core Only'));
        o.rmempty = false;

        s = m.section(form.NamedSection, 'env', 'env', _('🛠️ Core Environment Variable Config'));

        o = s.option(form.DynamicList, 'safe_paths', _('Safe Paths'));
        o.load = function (section_id) {
            const val = this.super('load', section_id);
            return val ? val.split(':') : [];
        };
        o.write = function (section_id, formvalue) {
            this.super('write', section_id, formvalue ? formvalue.join(':') : '');
        };

        o = s.option(form.Flag, 'disable_loopback_detector', _('Disable Loopback Detector'));
        o.rmempty = false;

        o = s.option(form.Flag, 'disable_quic_go_gso', _('Disable GSO of quic-go'));
        o.rmempty = false;

        o = s.option(form.Flag, 'disable_quic_go_ecn', _('Disable ECN of quic-go'));
        o.rmempty = false;

        o = s.option(form.Flag, 'skip_system_ipv6_check', _('Skip System IPv6 Check'));
        o.rmempty = false;

        return m.render();
    }
});
