import { type JClipboardEvent, type JFormEvent, type WithEvents, cx } from "jinge";

export type InputInnerProps = {
  className: string;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
} & WithEvents<{
  input?: (evt: JFormEvent<HTMLInputElement>) => void;
  blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
  focus?: (evt: JClipboardEvent<HTMLInputElement>) => void;
}>

export function InputInner(props: InputInnerProps) {
  return <input
    className={props.className}
    placeholder={props.placeholder}
    disabled={props.disabled}
    value={props.value}
    on:input={props["on:input"]}
    on:blur={props['on:blur']}
    on:focus={props['on:focus']}
  />
}