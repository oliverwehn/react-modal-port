import { Component, memo, type FC, type ReactNode } from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import type { LaunchModal, ModalHandle, ModalStackEntry, UpdateModalState } from '../index';
import { useModal, useModalStack, useModalState } from '../index';

declare const launchModal: LaunchModal;

type DecisionProps = {
  decideYay: () => void;
  decideNay: (reason: string) => void;
  leaveMeAlone?: () => void;
  timeLeft: number;
  title?: string;
};
declare const Decision: FC<DecisionProps>;
declare const Simple: (props: { onClose: () => void }) => ReactNode;
declare const OptionalOnly: FC<{ onClose: () => void; title?: string }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed modals must keep working
declare const Loose: FC<Record<string, any>>;
declare const NoProps: FC;

describe('launchModal types', () => {
  it('infers resolvers and checks the remaining props', () => {
    launchModal(Decision, { decideYay: () => {}, decideNay: (_reason) => {} }, { timeLeft: 1 });
    launchModal(Decision, { decideYay: () => {} }, { timeLeft: 1, decideNay: () => {} }, { onDismiss: () => {} });
    launchModal(Decision, { decideYay: async () => {}, decideNay: () => {} }, { timeLeft: 1, title: 't' });
    launchModal(Simple, { onClose: () => {} });
    launchModal(Simple, { onClose: () => {} }, {}, { onDismiss: () => {} });
    launchModal(OptionalOnly, { onClose: () => {} });
    launchModal(Loose, { onClose: () => {} }, { anything: 1 });
    launchModal(Loose, {});
    launchModal(NoProps, {});
    launchModal(
      memo((props: { onClose: () => void; n: number }) => <p>{props.n}</p>),
      { onClose: () => {} },
      { n: 1 },
    );
    class Klass extends Component<{ onClose: () => void; label: string }> {
      override render() {
        return this.props.label;
      }
    }
    launchModal(Klass, { onClose: () => {} }, { label: 'x' });
  });

  it('rejects mistakes', () => {
    // @ts-expect-error misspelled resolver
    launchModal(Decision, { decideYey: () => {} }, { timeLeft: 1, decideNay: () => {} });
    // @ts-expect-error missing required prop
    launchModal(Decision, { decideYay: () => {}, decideNay: () => {} }, {});
    // @ts-expect-error props argument omitted although `timeLeft` is required
    launchModal(Decision, { decideYay: () => {}, decideNay: () => {} });
    // @ts-expect-error wrong prop type
    launchModal(Decision, { decideYay: () => {}, decideNay: () => {} }, { timeLeft: 'soon' });
    // @ts-expect-error resolver with an incompatible signature
    launchModal(Decision, { decideYay: () => {}, decideNay: (_reason: number) => {} }, { timeLeft: 1 });
    // @ts-expect-error a non-function prop cannot be a resolver
    launchModal(Decision, { timeLeft: 1 }, {});
    // @ts-expect-error unknown prop when nothing is left to pass
    launchModal(Simple, { onClose: () => {} }, { nope: 1 });
    // @ts-expect-error onBackdropClick moved to options.onDismiss
    launchModal(Simple, { onClose: () => {}, onBackdropClick: () => {} });
  });

  it('returns a handle', () => {
    expectTypeOf(launchModal(Simple, { onClose: () => {} })).toEqualTypeOf<ModalHandle>();
    expectTypeOf<ModalHandle['close']>().toEqualTypeOf<() => void>();
  });
});

describe('hook types', () => {
  it('types useModal, useModalStack and useModalState', () => {
    expectTypeOf(useModal).returns.toEqualTypeOf<LaunchModal>();
    expectTypeOf(useModalStack).returns.toEqualTypeOf<readonly ModalStackEntry[]>();
    expectTypeOf(useModalState<{ name: string }>).returns.toEqualTypeOf<
      [{ name: string } | null, UpdateModalState<{ name: string }>]
    >();
  });
});
