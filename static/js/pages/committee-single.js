'use strict';

/* global document */

var $ = require('jquery');
var _ = require('underscore');

var events = require('fec-style/js/events');

var maps = require('../modules/maps');
var tables = require('../modules/tables');
var filings = require('../modules/filings');
var helpers = require('../modules/helpers');
var columns = require('../modules/columns');

var tableOpts = {
  dom: tables.simpleDOM,
  pagingType: 'simple',
  lengthChange: false,
  pageLength: 10,
  useHideNull: false,
  hideEmpty: true
};

var sizeColumns = [
  {
    data: 'size',
    width: '50%',
    className: 'all',
    render: function(data, type, row, meta) {
      return columns.sizeInfo[data].label;
    }
  },
  {
    data: 'total',
    width: '50%',
    className: 'all',
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['receipts'], function(data, type, row, meta) {
      return columns.getSizeParams(row.size);
    })
  }
];

var committeeColumns = [
  {
    data: 'contributor_name',
    className: 'all',
    orderable: false,
    render: function(data, type, row, meta) {
      return tables.buildEntityLink(
        data,
        helpers.buildAppUrl(['committee', row.contributor_id]),
        'committee'
      );
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['receipts'], function(data, type, row, meta) {
      return {contributor_id: row.contributor_id};
    })
  }
];

var stateColumns = [
  {
    data: 'state_full',
    width: '50%',
    className: 'all',
    render: function(data, type, row, meta) {
      var span = document.createElement('span');
      span.textContent = data;
      span.setAttribute('data-state', data);
      span.setAttribute('data-row', meta.row);
      return span.outerHTML;
    }
  },
  {
    data: 'total',
    width: '50%',
    className: 'all',
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['receipts'], function(data, type, row, meta) {
      return {
        contributor_state: row.state,
        is_individual: 'true'
      };
    })
  },
];

var employerColumns = [
  {data: 'employer', className: 'all', orderable: false, defaultContent: 'NOT REPORTED'},
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['receipts'], function(data, type, row, meta) {
      if (row.employer) {
        return {
          contributor_employer: row.employer,
          is_individual: 'true'
        };
      } else {
        return null;
      }
    })
  }
];

var occupationColumns = [
  {data: 'occupation', className: 'all', orderable: false, defaultContent: 'NOT REPORTED'},
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['receipts'], function(data, type, row, meta) {
      if (row.occupation) {
        return {
          contributor_occupation: row.occupation,
          is_individual: 'true'
        };
      } else {
        return null;
      }
    })
  }
];

var filingsColumns = columns.getColumns(
  columns.filings,
  [
    'pdf_url', 'amendment_indicator', 'receipt_date', 'coverage_end_date',
    'total_receipts', 'total_disbursements', 'total_independent_expenditures',
    'modal_trigger'
  ]
);

var disbursementPurposeColumns = [
  {data: 'purpose', className: 'all', orderable: false},
  tables.barCurrencyColumn({data: 'total', className: 'all', orderable: false})
];

var disbursementRecipientColumns = [
  {data: 'recipient_name', className: 'all', orderable: false},
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['disbursements'], function(data, type, row, meta) {
      return {recipient_name: row.recipient_name};
    })
  }
];

var disbursementRecipientIDColumns = [
  {
    data: 'recipient_name',
    className: 'all',
    orderable: false,
    render: function(data, type, row, meta) {
      return tables.buildEntityLink(data, '/committee/' + row.recipient_id, 'committee');
    }
  },
  {
    data: 'total',
    className: 'all',
    orderable: false,
    orderSequence: ['desc', 'asc'],
    render: tables.buildTotalLink(['disbursements'], function(data, type, row, meta) {
      return {recipient_committee_id: row.recipient_id};
    })
  }
];

function buildStateUrl($elm) {
  return helpers.buildUrl(
    ['committee', $elm.data('committee-id'), 'schedules', 'schedule_a', 'by_state'],
    {cycle: $elm.data('cycle'), per_page: 99}
  );
}

function highlightRowAndState($map, $table, state, scroll) {
  var $scrollBody = $table.closest('.dataTables_scrollBody');
  var $row = $scrollBody.find('span[data-state="' + state + '"]');

  if ($row.length > 0) {
    maps.highlightState($('.state-map'), state);
    $scrollBody.find('.row-active').removeClass('row-active');
    $row.parents('tr').addClass('row-active');
    if (scroll) {
      $scrollBody.animate({
        scrollTop: $row.closest('tr').height() * parseInt($row.attr('data-row'))
      }, 500);
    }
  }

}

var aggregateCallbacks = _.extend(
  {afterRender: tables.barsAfterRender.bind(undefined, undefined)},
  tables.offsetCallbacks
);

$(document).ready(function() {
  // Set up data tables
  $('.data-table').each(function(index, table) {
    var $table = $(table);
    var committeeId = $table.attr('data-committee');
    var cycle = $table.attr('data-cycle');
    var query = {cycle: cycle};
    var path;
    switch ($table.attr('data-type')) {
      case 'committee-contributor':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_contributor'];
        tables.initTableDeferred($table, null, path, query, committeeColumns, aggregateCallbacks, {
          dom: tables.simpleDOM,
          order: [[1, 'desc']],
          pagingType: 'simple',
          lengthChange: false,
          pageLength: 10,
          useHideNull: false,
          hideEmpty: true
        });
        break;
      case 'contribution-size':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_size'];
        tables.initTableDeferred($table, null, path, query, sizeColumns, aggregateCallbacks, {
          dom: 't',
          order: [[1, 'desc']],
          pagingType: 'simple',
          lengthChange: false,
          pageLength: 10,
          useHideNull: false,
          hideEmpty: true
        });
        break;
      case 'receipts-by-state':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_state'];
        query = _.extend(query, {per_page: 99, hide_null: true});
        tables.initTableDeferred($table, null, path, query, stateColumns, aggregateCallbacks,
          _.extend(
            {},
            tableOpts,
            {
              dom: 't',
              order: [[1, 'desc']],
              paging: false,
              scrollY: 400,
              scrollCollapse: true
            }
          )
        );
        events.on('state.map', function(params) {
          var $map = $('.state-map');
          highlightRowAndState($map, $table, params.state, true);
        });
        $table.on('click', 'tr', function(e) {
          events.emit('state.table', {state: $(this).find('span[data-state]').attr('data-state')});
        });
        break;
      case 'receipts-by-employer':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_employer'];
        tables.initTableDeferred($table, null, path, query, employerColumns, aggregateCallbacks, _.extend({}, tableOpts, {
          order: [[1, 'desc']],
        }));
        break;
      case 'receipts-by-occupation':
        path = ['committee', committeeId, 'schedules', 'schedule_a', 'by_occupation'];
        tables.initTableDeferred($table, null, path, query, occupationColumns, aggregateCallbacks, _.extend({}, tableOpts, {
          order: [[1, 'desc']],
        }));
        break;
      case 'filing':
        path = ['committee', committeeId, 'filings'];
        tables.initTableDeferred($table, null, path, query, filingsColumns,
          _.extend({}, tables.offsetCallbacks, {
            afterRender: filings.renderModal
          }),
          {
            rowCallback: filings.renderRow,
            dom: '<"panel__main"t><"results-info results-info--bottom"frip>',
            pagingType: 'simple',
            // Order by receipt date descending
            order: [[2, 'desc']],
            useFilters: true,
            hideEmpty: true
          }
        );
        break;
      case 'disbursements-by-purpose':
        path = ['committee', committeeId, 'schedules', 'schedule_b', 'by_purpose'];
        tables.initTableDeferred($table, null, path, query, disbursementPurposeColumns, aggregateCallbacks, _.extend({}, tableOpts, {
          order: [[1, 'desc']],
        }));
        break;
      case 'disbursements-by-recipient':
        path = ['committee', committeeId, 'schedules', 'schedule_b', 'by_recipient'];
        tables.initTableDeferred($table, null, path, query, disbursementRecipientColumns, aggregateCallbacks, _.extend({}, tableOpts, {
          order: [[1, 'desc']],
        }));
        break;
      case 'disbursements-by-recipient-id':
        path = ['committee', committeeId, 'schedules', 'schedule_b', 'by_recipient_id'];
        tables.initTableDeferred($table, null, path, query, disbursementRecipientIDColumns, aggregateCallbacks, _.extend({}, tableOpts, {
          order: [[1, 'desc']],
        }));
        break;
    }
  });

  // Set up state map
  var $map = $('.state-map');
  var url = buildStateUrl($map);
  $.getJSON(url).done(function(data) {
    maps.stateMap($map, data, 400, 300, null, null, true, true);
  });
  events.on('state.table', function(params) {
    highlightRowAndState($map, $('.data-table'), params.state, false);
  });
  $map.on('click', 'path[data-state]', function(e) {
    var state = $(this).attr('data-state');
    events.emit('state.map', {state: state});
  });
});
