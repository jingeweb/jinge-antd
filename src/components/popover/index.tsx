
import './style.scss';

import { Floating, type FloatingProps } from './floating';
import { cx } from 'jinge';

export type PopoverProps = FloatingProps;
export function Popover(props: FloatingProps) {
  return (
    <Floating
      slot:trigger={props['slot:trigger']}
      on:openChange={props['on:openChange']}
      open={props.open}
      delay={props.delay}
      offset={props.offset}
      placement={props.placement}
      triggerMethod={props.triggerMethod}
      className={cx(
        'ja-popover',
        props.className,
      )}
    >{props.children}</Floating>
  );
};