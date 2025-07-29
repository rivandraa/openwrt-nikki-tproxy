'use strict';
'require form';
'require view';
'require uci';
'require poll';
'require tools.nikki as nikki';

let currentStatus = 'stopped';

function renderStatus(status) {
    const colorMap = {
        running: { border: '#4caf50', top: '#81c784', emoji: '🟢', text: _('Running') },
        reloading: { border: '#ff9800', top: '#ffcc80', emoji: '🟡', text: _('Reloading...') },
        stopped: { border: '#f44336', top: '#e57373', emoji: '🔴', text: _('Not Running') }
    };

    const { border, top, emoji, text } = colorMap[status] || colorMap.stopped;

    const container = E('div', {
        id: 'nikki-status-container',
        style: `
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px;
        `
    });

    const ring = E('span', {
        style: `
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            position: relative;
        `
    }, [
        E('span', {
            style: `
                display: block;
                width: 32px; height: 32px; border-radius: 50%;
                border: 14px solid ${border};
                border-top-color: ${top};
                animation: spin 1s linear infinite;
            `
        }),
        E('span', {
            style: `
                position: absolute;
                top: 0; width: 32px; height: 32px;
                display: flex; align-items: center; justify-content: center;
                font-size: 0; color: ${border};
            `
        }, emoji)
    ]);

    container.title = text;
    container.appendChild(ring);

    let styleElement = document.getElementById('nikki-status-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'nikki-status-style';
        styleElement.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleElement);
    }

    const input = E('input', {
        id: 'core_status',
        style: 'display:none;',
        readonly: ''
    });
    input.value = text;
    container.appendChild(input);

    return container;
}

function updateStatus(element, status) {
    currentStatus = status;
    if (element) {
        const parent = element.parentElement;
        if (parent) {
            parent.replaceChild(renderStatus(status), element);
        }
    }
}

function addSpinnerToButton(eventName, asyncAction) {
    window.addEventListener(eventName, () => {
        const button = [...document.querySelectorAll('button')].find(btn =>
            btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(eventName)
        );
        if (!button) return;

        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin-btn 0.6s linear infinite;margin-right:6px;"></span>${originalHTML}`;

        asyncAction().finally(() => {
            button.disabled = false;
            button.innerHTML = originalHTML;
        });
    });
}

let styleEl = document.getElementById('nikki-spinner-style');
if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'nikki-spinner-style';
    styleEl.textContent = `
        @keyframes spin-btn {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleEl);
}

// Tambahkan responsive style
let responsiveStyle = document.getElementById('nikki-responsive-style');
if (!responsiveStyle) {
    responsiveStyle = document.createElement('style');
    responsiveStyle.id = 'nikki-responsive-style';
    responsiveStyle.innerHTML = `
        @media (max-width: 600px) {
            #nikki-status-container {
                flex-direction: column;
            }
            .cbi-button {
                width: 100%;
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(responsiveStyle);
}

function extractVersion(full) {
    const m = full.match(/v?(\d+\.\d+\.\d+)(-.+)?/);
    return m ? { main: m[1], suffix: m[2] || "" } : { main: full, suffix: "" };
}
function normalizeVersion(vObj) {
    return {
        main: vObj.main.replace(/^v/, ''),
        suffix: vObj.suffix
    };
}
function compareVersions(a, b) {
    const pa = a.main.split('.').map(Number);
    const pb = b.main.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }
    if (a.suffix !== b.suffix) {
        const ra = (a.suffix.match(/r(\d+)/) || [0,0])[1];
        const rb = (b.suffix.match(/r(\d+)/) || [0,0])[1];
        if (+ra > +rb) return 1;
        if (+ra < +rb) return -1;
    }
    return 0;
}
function notifyNewVersion(latestTag) {
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
                ${latestTag}
            </a>
        </span>
        <span style="cursor: pointer; color: red; font-weight: bold;" onclick="this.parentElement.remove();">❌</span>
    `;

    container.appendChild(notif);
    setTimeout(() => notif.remove(), 10000);
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
        const subscriptions = uci.sections('nikki', 'subscription');
        const appVersion = (data[1] && data[1].app) || '';
        const coreVersion = (data[1] && data[1].core) || '';
        const isRunning = data[2] !== undefined ? data[2] : false;
        const profiles = data[3] !== undefined ? data[3] : [];
        currentStatus = isRunning ? 'running' : 'stopped';

        const m = new form.Map('nikki');

        setTimeout(() => {
            const currentVersionRaw = extractVersion(appVersion || "unknown");
            const currentVersion = normalizeVersion(currentVersionRaw);

            fetch('https://api.github.com/repos/rivandraa/nikki_tproxy/releases/latest')
                .then(response => response.json())
                .then(data => {
                    const latestVersionRaw = extractVersion(data.tag_name || "");
                    const latestVersion = normalizeVersion(latestVersionRaw);

                    if (latestVersion.main && compareVersions(latestVersion, currentVersion) > 0) {
                        notifyNewVersion(data.tag_name);
                    }
                })
                .catch(err => {
                    console.warn("Gagal memeriksa versi terbaru:", err);
                });
        }, 100);

        let s = m.section(form.TableSection, 'status', _('📊 Status'));
        s.anonymous = true;

        let o = s.option(form.DummyValue, '_core_status', _('APP Status'));
        o.cfgvalue = () => renderStatus(currentStatus);

        poll.add(function () {
            return L.resolveDefault(nikki.status()).then(function (isRunning) {
                const newStatus = isRunning ? 'running' : 'stopped';
                updateStatus(document.getElementById('nikki-status-container'), newStatus);
            });
        });

        o = s.option(form.DummyValue, '_app_version', _('App Version'));
        o.rawhtml = true;
        o.readonly = true;
        o.cfgvalue = () => `<a href="https://t.me/NikkiTProxy" target="_blank">${appVersion}</a>`;

        o = s.option(form.DummyValue, '_core_version', _('Core Version'));
        o.rawhtml = true;
        o.readonly = true;
        o.cfgvalue = () => coreVersion;

        o = s.option(form.DummyValue, '_controls', _('Service Controls'));
        o.rawhtml = true;
        o.cfgvalue = () => `
            <div style="
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
                padding: 10px 0;
            ">
                <button type="button" class="cbi-button cbi-button-action" onclick="window.dispatchEvent(new CustomEvent('nikki-reload-clicked'))">RELOAD SERVICE</button>
                <button type="button" class="cbi-button cbi-button-negative" onclick="window.dispatchEvent(new CustomEvent('nikki-restart-clicked'))">RESTART SERVICE</button>
                <button type="button" class="cbi-button cbi-button-positive" onclick="window.dispatchEvent(new CustomEvent('nikki-update_dashboard-clicked'))">UPDATE DASHBOARD</button>
                <button type="button" class="cbi-button cbi-button-neutral" onclick="window.dispatchEvent(new CustomEvent('nikki-open_dashboard-clicked'))">OPEN DASHBOARD</button>
            </div>
        `;

        setTimeout(() => {
            const container = () => document.getElementById('nikki-status-container');

            addSpinnerToButton('nikki-reload-clicked', () => {
                updateStatus(container(), 'reloading');
                return nikki.reload().then(() => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            nikki.status().then(r => {
                                updateStatus(container(), r ? 'running' : 'stopped');
                                resolve();
                            });
                        }, 2000);
                    });
                });
            });

            addSpinnerToButton('nikki-restart-clicked', () => {
                updateStatus(container(), 'reloading');
                return nikki.restart().then(() => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            nikki.status().then(r => {
                                updateStatus(container(), r ? 'running' : 'stopped');
                                resolve();
                            });
                        }, 2000);
                    });
                });
            });

            addSpinnerToButton('nikki-update_dashboard-clicked', () => {
                return Promise.resolve(nikki.updateDashboard());
            });

            addSpinnerToButton('nikki-open_dashboard-clicked', () => {
                return Promise.resolve(nikki.openDashboard());
            });
        }, 100);

        // CONFIG SECTION
        s = m.section(form.NamedSection, 'config', 'config', _('⚙️ App Config'));
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

        // ENV SECTION
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
