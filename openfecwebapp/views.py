import datetime
import collections

import furl

from flask.views import MethodView
from flask import request, render_template, jsonify
from flask.ext.cors import cross_origin

from webargs import fields
from webargs.flaskparser import use_kwargs
from marshmallow import ValidationError

import github3
from werkzeug.utils import cached_property

from openfecwebapp import config
from openfecwebapp import api_caller


def render_search_results(results, query, result_type):
    return render_template(
        'search-results.html',
        results=results,
        result_type=result_type,
        query=query,
    )


def to_date(committee, cycle):
    if committee['committee_type'] in ['H', 'S', 'P']:
        return None
    return min(datetime.datetime.now().year, cycle)


def render_committee(committee, candidates=None, cycle=None):
    # committee fields will be top-level in the template
    tmpl_vars = committee

    tmpl_vars['cycle'] = cycle
    tmpl_vars['year'] = to_date(committee, cycle)
    tmpl_vars['result_type'] = 'committees'

    # add related candidates a level below
    tmpl_vars['candidates'] = candidates

    financials = api_caller.load_cmte_financials(committee['committee_id'], cycle=cycle)
    tmpl_vars['reports'] = financials['reports']
    tmpl_vars['totals'] = financials['totals']

    return render_template('committees-single.html', **tmpl_vars)


def groupby(values, keygetter):
    ret = {}
    for value in values:
        key = keygetter(value)
        ret.setdefault(key, []).append(value)
    return ret


def aggregate_committees(committees):
    ret = collections.defaultdict(int)
    start_dates, end_dates = [], []
    for each in committees:
        totals = each['totals'][0] if each['totals'] else {}
        reports = each['reports'][0] if each['reports'] else {}
        ret['receipts'] += totals.get('receipts') or 0
        ret['disbursements'] += totals.get('disbursements') or 0
        ret['cash'] += reports.get('cash_on_hand_end_period') or 0
        ret['debt'] += reports.get('debts_owed_by_committee') or 0
        if totals.get('coverage_start_date'):
            start_dates.append(totals['coverage_start_date'])
        if totals.get('coverage_end_date'):
            end_dates.append(totals['coverage_end_date'])
    ret['start_date'] = min(start_dates) if start_dates else None
    ret['end_date'] = min(end_dates) if end_dates else None
    return ret


def render_candidate(candidate, committees, cycle):
    # candidate fields will be top-level in the template
    tmpl_vars = candidate

    tmpl_vars['cycle'] = cycle
    tmpl_vars['result_type'] = 'candidates'

    committee_groups = groupby(committees, lambda each: each['designation'])
    committees_authorized = committee_groups.get('P', []) + committee_groups.get('A', [])
    for committee in committees_authorized:
        committee.update(
            api_caller.load_cmte_financials(
                committee['committee_id'],
                cycle=cycle,
            )
        )

    tmpl_vars['committee_groups'] = committee_groups
    tmpl_vars['committees_authorized'] = committees_authorized
    tmpl_vars['committee_ids'] = [committee['committee_id'] for committee in committees_authorized]
    tmpl_vars['aggregate'] = aggregate_committees(committees_authorized)

    tmpl_vars['elections'] = sorted(
        zip(candidate['election_years'], candidate['election_districts']),
        key=lambda pair: pair[0],
        reverse=True,
    )

    return render_template('candidates-single.html', **tmpl_vars)


def validate_referer(referer):
    if furl.furl(referer).host != furl.furl(request.url).host:
        raise ValidationError('Invalid referer.')

class GithubView(MethodView):

    decorators = [cross_origin()]

    @cached_property
    def repo(self):
        client = github3.login(token=config.github_token)
        return client.repository('18F', 'fec')

    @use_kwargs({
        'referer': fields.Url(
            required=True,
            validate=validate_referer,
            location='headers',
        ),
        'action': fields.Str(),
        'response': fields.Str(),
        'feedback': fields.Str(),
    })
    def post(self, **kwargs):
        if not any([kwargs['action'], kwargs['response'], kwargs['feedback']]):
            return jsonify({
                'message': 'Must provide one of "action", "response", or "feedback".',
            }), 422
        title = 'User feedback on {}'.format(kwargs['referer'])
        body = render_template('feedback.html', headers=request.headers, **kwargs)
        issue = self.repo.create_issue(title, body=body)
        return jsonify(issue.to_json()), 201
