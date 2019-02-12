import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { NgxsModule, Store, State, Action, StateContext } from '@ngxs/store';
import { NoopErrorHandler } from '@ngxs/store/tests/helpers/utils';

import { NgxsLoggerPluginModule, NgxsLoggerPluginOptions } from '../';
import { LoggerSpy, formatActionCallStack } from './helpers';

describe('NgxsLoggerPlugin', () => {
  class UpdateBarAction {
    static type = 'SUCCESS';

    constructor(public payload?: string) {}
  }

  class ErrorAction {
    static type = 'ERROR';
  }

  interface StateModel {
    bar: string;
  }

  const stateModelDefaults: StateModel = {
    bar: ''
  };

  @State<StateModel>({
    name: 'test',
    defaults: stateModelDefaults
  })
  class TestState {
    @Action(UpdateBarAction)
    updateBar({ patchState }: StateContext<StateModel>, action: UpdateBarAction) {
      patchState({ bar: action.payload || 'baz' });
    }

    @Action(ErrorAction)
    error(ctx: StateContext<StateModel>) {
      return throwError(new Error('Error'));
    }
  }

  function setup(opts?: Partial<NgxsLoggerPluginOptions>) {
    const logger = new LoggerSpy();

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([TestState]),
        NgxsLoggerPluginModule.forRoot({
          logger,
          collapsed: false,
          disabled: false,
          ...opts
        })
      ],
      providers: [{ provide: ErrorHandler, useClass: NoopErrorHandler }]
    });

    return {
      store: TestBed.get(Store),
      logger
    };
  }

  it('should log success action', () => {
    const { store, logger } = setup();

    store.dispatch(new UpdateBarAction());

    expect(logger.callStack).toEqual(
      LoggerSpy.createCallStack([
        ...formatActionCallStack({ action: '@@INIT', prevState: stateModelDefaults }),

        ...formatActionCallStack({
          action: 'SUCCESS',
          prevState: stateModelDefaults,
          nextState: { bar: 'baz' }
        })
      ])
    );
  });

  it('should log success action with payload', () => {
    const { store, logger } = setup();
    const payload = 'baz';

    store.dispatch(new UpdateBarAction(payload));

    expect(logger.callStack).toEqual(
      LoggerSpy.createCallStack([
        ...formatActionCallStack({ action: '@@INIT', prevState: stateModelDefaults }),

        ...formatActionCallStack({
          action: 'SUCCESS',
          prevState: stateModelDefaults,
          nextState: { bar: 'baz' },
          payload
        })
      ])
    );
  });

  it('should log error action', () => {
    const { store, logger } = setup();

    store.dispatch(new ErrorAction());

    expect(logger.callStack).toEqual(
      LoggerSpy.createCallStack([
        ...formatActionCallStack({ action: '@@INIT', prevState: stateModelDefaults }),

        ...formatActionCallStack({
          action: 'ERROR',
          error: 'Error',
          prevState: stateModelDefaults
        })
      ])
    );
  });

  it('should log collapsed success action', () => {
    const { store, logger } = setup({ collapsed: true });

    store.dispatch(new UpdateBarAction());

    expect(logger.callStack).toEqual(
      LoggerSpy.createCallStack([
        ...formatActionCallStack({
          action: '@@INIT',
          prevState: stateModelDefaults,
          collapsed: true
        }),

        ...formatActionCallStack({
          action: 'SUCCESS',
          prevState: stateModelDefaults,
          nextState: { bar: 'baz' },
          collapsed: true
        })
      ])
    );
  });

  it('should not log while disabled', () => {
    const { store, logger } = setup({ disabled: true });

    store.dispatch(new UpdateBarAction());

    expect(logger.callStack).toEqual(LoggerSpy.createCallStack([]));
  });
});
