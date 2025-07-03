'use strict';
'require view';
'require uci';

return view.extend({
    load: function() {
        return uci.load('nikki');
    },
    render: function() {
        const iframe = E('iframe', {
            src: window.location.protocol + "//" + window.location.hostname + '/tinyfm/nikkifm.php',
            style: 'width: 100%; min-height: 95vh; border: none; border-radius: 5px; resize: vertical;'
        });
        return E('div', { class: 'cbi-map' }, iframe); // Pastikan ini menambahkan iframe ke dalam div
    },
    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
