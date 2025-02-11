"use strict";

let tsm_interval_id;
let tsm_status = 'stopped';
let tsm_datatables;
let tsm_ajax_url;

function tsmOnLoadMain() {
    console.log('Loading The SEO Machine view..');

    tsmLoadDatatables();
    tsmUpdateStatusBar();
}

function tsmLoadDatatables() {
    jQuery('#tsm-datatable tfoot th').each(function () {
        let title = jQuery(this).text();

        jQuery(this).html('<input type="text" placeholder="Filter.." />');
    })

    let currentColumnsToShow = document.getElementById('tsm-current-columns-to-show').value;
    currentColumnsToShow = currentColumnsToShow.split(',');
    console.log(currentColumnsToShow);

    let columnDefsArray = new Array();
    for (let index = 0; index < currentColumnsToShow.length; index++) {
        columnDefsArray.push({ "name": currentColumnsToShow[index], "targets": index });
    }
    console.log(columnDefsArray);

    tsm_datatables = jQuery('#tsm-datatable').DataTable({
        dom: '<"float-left"i><"float-right"f>t<"float-left"l>B<"float-right"p><"clearfix">',
        responsive: true,
        order: [[0, "desc"]],
        buttons: [
            {
                extend: 'csv',
                text: 'CSV'
            }, 'excel', 'pdf'],
        initComplete: function () {
            this.api().columns().every(function () {
                let that = this

                jQuery('input', this.footer()).on('keyup change', function () {
                    if (that.search() !== this.value) {
                        that
                            .search(this.value)
                            .draw()
                    }
                })
            })
        },
        processing: true,
        serverSide: true,
        ajax: {
            url: tsm_ajax_url + '?action=tsm_urls',
            type: 'POST'
        },
        columnDefs: columnDefsArray,
        aLengthMenu: [[10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, -1], [10, 25, 50, 100, 500, 1000, 2000, 5000, 10000, "All"]]
    });

    let currentAutoreloadDatatables = document.getElementById('autoreload_datatables').value;
    if (currentAutoreloadDatatables > 0) {
        setInterval(function () {
            tsm_datatables.ajax.reload();
            tsmUpdateStatusBar();
        }, currentAutoreloadDatatables * 1000);
    }

    console.log('Loaded The SEO Machine view!');
}

function tsmStudySite() {
    console.log('Starting study site..');
    document.getElementById('tsm-btn-study-site').innerHTML = 'Stop';
    document.getElementById('tsm-btn-study-site').classList.add('tsm-button-studying');

    let quantity_per_batch = document.getElementById('quantity_per_batch').value;
    let time_between_batches = document.getElementById('time_between_batches').value;
    console.log('Quantity per batch: ' + quantity_per_batch + ', time between batches: ' + time_between_batches);

    tsm_interval_id = setInterval(tsmStudySiteSendAjax, time_between_batches * 1000);
    tsm_status = 'studying';
}

function tsmStudySiteSendAjax() {
    document.getElementById('tsm-box-study-site-status').innerHTML = 'Doing batch..';

    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function (response) {
        if (xhr.readyState === 4) {
            document.getElementById('tsm-box-study-site-status').innerHTML = 'Studying with current status: <strong>' + xhr.responseText + '</strong>';
            tsmUpdateStatusBar();
            tsm_datatables.ajax.reload();
            if (xhr.responseText.includes('finished')) {
                tsmStopAll();
            }
        }
    }

    xhr.open('POST', tsm_ajax_url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.send('action=tsm_do_batch');
}

function tsmUpdateStatusBar() {
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function (response) {
        if (xhr.readyState === 4) {
            let num_urls_in_queue = xhr.responseText.split(',')[0];
            let num_urls_in_queue_visited = xhr.responseText.split(',')[1];
            let num_urls = xhr.responseText.split(',')[2];

            document.getElementById('tsm-progress-queue-text').innerHTML = num_urls_in_queue_visited
                + ' URLs studied from the queue out of a total of ' + num_urls_in_queue + ' URLs enqueued';
            document.getElementById('tsm-progress-queue-content').style.width = (num_urls_in_queue_visited * 100 / num_urls_in_queue) + '%';
        }
    }

    xhr.open('POST', tsm_ajax_url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.send('action=tsm_get_status');
}

function tsmStopAll() {
    clearInterval(tsm_interval_id);
    document.getElementById('tsm-btn-study-site').innerHTML = 'Study Site';
    document.getElementById('tsm-btn-study-site').classList.remove('tsm-button-studying');
    tsm_status = 'stopped';
}

// Starts all JS..
window.addEventListener('load', () => {
    if (typeof weAreInTheSeoMachine !== 'undefined') {
        tsm_ajax_url = document.getElementById('tsm_form').dataset.tsm_ajax_url;

        tsmOnLoadMain();
        document.getElementById('tsm-btn-study-site').addEventListener('click', function () {
            if (tsm_status == 'stopped') {
                tsmStudySite();
            } else {
                tsmStopAll();
            }
        })
    }
})
