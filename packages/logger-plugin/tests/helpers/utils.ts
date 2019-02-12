import { CallStack } from './symbols';

export class FormatActionCallStackOptions {
  action: string;
  error: string;
  prevState: {};
  nextState: {} = {};
  collapsed = false;
  payload: string;
}

export function formatActionCallStack(opts: Partial<FormatActionCallStackOptions>): CallStack {
  const { action, error, prevState, nextState, collapsed, payload } = opts;

  const formattedPayload = payload
    ? [['log', '%c payload', 'color: #9E9E9E; font-weight: bold', payload]]
    : [];

  return [
    [collapsed ? 'groupCollapsed' : 'group', `action ${action} @ `],
    ...formattedPayload,
    ['log', '%c prev state', 'color: #9E9E9E; font-weight: bold', { test: prevState }],
    [
      'log',
      error ? '%c error' : '%c next state',
      `color: #${error ? 'FD8182' : '4CAF50'}; font-weight: bold`,
      error ? {} : { test: { ...prevState, ...nextState } }
    ],
    ['groupEnd']
  ];
}
