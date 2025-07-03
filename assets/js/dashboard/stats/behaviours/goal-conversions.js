import React from 'react'
import Conversions from './conversions'
import ListReport from '../reports/list'
import * as metrics from '../reports/metrics'
import * as url from '../../util/url'
import * as api from '../../api'
import { EVENT_PROPS_PREFIX, FILTER_OPERATIONS } from '../../util/filters'
import { useSiteContext } from '../../site-context'
import { useQueryContext } from '../../query-context'
import { customPropsRoute } from '../../router'
import { matchBy } from '../../util/match-by'
import { TopPagesReport } from '../pages'

function getFilterInfoForPath(listItem) {
  return {
    prefix: EVENT_PROPS_PREFIX,
    filter: [FILTER_OPERATIONS.is, `${EVENT_PROPS_PREFIX}path`, [listItem.name]]
  }
}

function getFilterInfoForUrl(listItem) {
  return {
    prefix: EVENT_PROPS_PREFIX,
    filter: [FILTER_OPERATIONS.is, `${EVENT_PROPS_PREFIX}url`, [listItem.name]]
  }
}

export const FORM_SUBMISSION_EVENT_NAME = 'Form: Submission'

export const SPECIAL_GOALS = {
  404: { title: '404 Pages', prop: 'path' },
  'Outbound Link: Click': {
    title: 'Outbound Links',
    prop: 'url',
    getFilterInfo: getFilterInfoForUrl
  },
  'Cloaked Link: Click': {
    title: 'Cloaked Links',
    prop: 'url',
    getFilterInfo: getFilterInfoForUrl
  },
  'File Download': {
    title: 'File Downloads',
    prop: 'url',
    getFilterInfo: getFilterInfoForUrl
  },
  'WP Search Queries': {
    title: 'WordPress Search Queries',
    prop: 'search_query',
    getFilterInfo: (listItem) => ({
      prefix: EVENT_PROPS_PREFIX,
      filter: [
        FILTER_OPERATIONS.is,
        `${EVENT_PROPS_PREFIX}search_query`,
        [listItem.name]
      ]
    })
  },
  'WP Form Completions': {
    title: 'WordPress Form Completions',
    prop: 'path',
    getFilterInfo: getFilterInfoForPath
  }
}

function getGoalIsSingleGoalFilter(query) {
  const resolvedIsSingleGoalFilters = query.resolvedFilters.filter(
    matchBy([FILTER_OPERATIONS.is, 'goal', [matchBy._]])
  )

  if (resolvedIsSingleGoalFilters.length === 1) {
    return resolvedIsSingleGoalFilters[0]
  }

  return null
}

export function specialTitleWhenGoalFilter(query, defaultTitle) {
  const goalIsSingleGoalFilter = getGoalIsSingleGoalFilter(query)
  if (goalIsSingleGoalFilter) {
    const [_operation, _dimension, [goalName]] = goalIsSingleGoalFilter
    if (goalName in SPECIAL_GOALS) {
      return SPECIAL_GOALS[goalName].title
    }
    if (goalName === FORM_SUBMISSION_EVENT_NAME) {
      return 'Form Submissions'
    }
  }
  return defaultTitle
}

function SpecialPropBreakdown({ getFilterInfo, prop, afterFetchData }) {
  const site = useSiteContext()
  const { query } = useQueryContext()

  function fetchData() {
    return api.get(url.apiPath(site, `/custom-prop-values/${prop}`), query)
  }

  function getExternalLinkUrl(listItem) {
    if (prop === 'path') {
      return url.externalLinkForPage(site.domain, listItem.name)
    } else {
      return listItem.name
    }
  }

  function chooseMetrics() {
    return [
      metrics.createVisitors({
        renderLabel: (_query) => 'Visitors',
        meta: { plot: true }
      }),
      metrics.createEvents({
        renderLabel: (_query) => 'Events',
        meta: { hiddenOnMobile: true }
      }),
      metrics.createConversionRate()
    ].filter((metric) => !!metric)
  }

  return (
    <ListReport
      fetchData={fetchData}
      afterFetchData={afterFetchData}
      getFilterInfo={getFilterInfo}
      keyLabel={prop}
      metrics={chooseMetrics()}
      detailsLinkProps={{
        path: customPropsRoute.path,
        params: { propKey: url.maybeEncodeRouteParam(prop) },
        search: (search) => search
      }}
      getExternalLinkUrl={getExternalLinkUrl}
      maybeHideDetails={true}
      color="bg-red-50"
      colMinWidth={90}
    />
  )
}

export default function GoalConversions({ afterFetchData, onGoalFilterClick }) {
  const { query } = useQueryContext()

  const goalIsSingleGoalFilter = getGoalIsSingleGoalFilter(query)
  if (goalIsSingleGoalFilter) {
    const [_operation, _dimension, [goalName]] = goalIsSingleGoalFilter
    if (goalName in SPECIAL_GOALS) {
      const specialGoal = SPECIAL_GOALS[goalName]
      return (
        <SpecialPropBreakdown
          getFilterInfo={specialGoal.getFilterInfo}
          prop={specialGoal.prop}
          afterFetchData={afterFetchData}
        />
      )
    }
    if (goalName === FORM_SUBMISSION_EVENT_NAME) {
      return <TopPagesReport />
    }
  }

  return (
    <Conversions
      onGoalFilterClick={onGoalFilterClick}
      afterFetchData={afterFetchData}
    />
  )
}
