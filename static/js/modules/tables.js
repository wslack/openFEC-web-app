'use strict';

/* global require, module, document, API_LOCATION, API_VERSION, API_KEY */

var $ = require('jquery');
var _ = require('underscore');
var URI = require('URIjs');
require('datatables');

function yearRange(first, last) {
  if (first === last) {
    return first;
  } else {
    return first.toString() + ' - ' + last.toString();
  }
}

function mapFilters(filters) {
  return _.reduce(filters, function(acc, val) {
    if (val.value) {
      if (acc[val.name]) {
        acc[val.name].push(val.value);
      } else {
        acc[val.name] = [val.value];
      }
    }
    return acc;
  }, {});
}

var parsedFilters;

function buildCycle(datum) {
  if (parsedFilters.cycle) {
    var cycles = _.intersection(
      _.map(parsedFilters.cycle, function(cycle) {return parseInt(cycle);}),
      datum.cycles
    );
    return '?cycle=' + _.max(cycles);
  } else {
    return '';
  }
}

function buildEntityLink(data, url, category) {
  var anchor = document.createElement('a');
  anchor.textContent = data;
  anchor.setAttribute('href', url);
  anchor.setAttribute('title', data);
  anchor.setAttribute('data-category', category);
  anchor.classList.add('single-link');
  return anchor.outerHTML;
}

var candidateColumns = [
  {
    data: 'name',
    className: 'all',
    render: function(data, type, row, meta) {
      return buildEntityLink(data, '/candidate/' + row.candidate_id + buildCycle(row), 'candidate');
    }
  },
  {data: 'office_full', className: 'min-tablet'},
  {
    data: 'election_years',
    className: 'min-tablet',
    render: function(data, type, row, meta) {
      return yearRange(data[0], row.active_through);
    }
  },
  {data: 'party_full', className: 'min-tablet'},
  {data: 'state', className: 'min-desktop'},
  {data: 'district', className: 'min-desktop'},
];

var committeeColumns = [
  {
    data: 'name',
    className: 'all',
    render: function(data, type, row, meta) {
      return buildEntityLink(data, '/committee/' + row.committee_id + buildCycle(row), 'committee');
    }
  },
  {data: 'treasurer_name', className: 'min-desktop'},
  {data: 'state', className: 'min-desktop'},
  {data: 'party_full', className: 'min-desktop'},
  {data: 'organization_type_full', className: 'min-desktop'},
  {data: 'committee_type_full', className: 'min-tablet'},
  {data: 'designation_full', className: 'min-tablet'},
];

function mapSort(order, columns) {
  return _.map(order, function(item) {
    var name = columns[item.column].data;
    if (item.dir === 'desc') {
      name = '-' + name;
    }
    return name;
  });
}

function mapResponse(response) {
  return {
    recordsTotal: response.pagination.count,
    recordsFiltered: response.pagination.count,
    data: response.results
  };
}

function initTable($table, $form, baseUrl, columns) {
  var draw;
  var api = $table.DataTable({
    serverSide: true,
    searching: false,
    columns: columns,
    lengthMenu: [30, 50, 100],
    responsive: true,
    language: {
      lengthMenu: 'Results per page: _MENU_'
    },
    dom: '<"results-info meta-box results-info--top"lfrip>t<"results-info meta-box"ip>',
    ajax: function(data, callback, settings) {
      var api = this.api();
      var filters = $form.serializeArray();
      parsedFilters = mapFilters(filters);
      var query = $.extend(
        {
          per_page: data.length,
          page: Math.floor(data.start / data.length) + 1,
          api_key: API_KEY
        },
        parsedFilters
      );
      query.sort = mapSort(data.order, columns);
      $.getJSON(
        URI(API_LOCATION)
        .path([API_VERSION, baseUrl].join('/'))
        .query(query)
        .toString()
      ).done(function(response) {
        callback(mapResponse(response));
      });
    }
  });
  $form.submit(function(event) {
    event.preventDefault();
    api.ajax.reload();
  });
}

module.exports = {
  init: function() {
    var $table = $('#results');
    var $form = $('#category-filters');
    if ($table.attr('data-type') === 'candidate') {
      initTable($table, $form, 'candidates', candidateColumns);
    } else {
      initTable($table, $form, 'committees', committeeColumns);
    }

    // Move the filter button into the results-info div
    var $filterToggle = $('#filter-toggle');
    $('.results-info--top').prepend($filterToggle);
  }
};
