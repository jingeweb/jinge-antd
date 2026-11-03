import { Dynamic, type JNode, type WithChildren, cx } from 'jinge';

import './style.scss';
export type TypographyProps = {
  className?: string;
  style?: string;
  tone?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  deleted?: boolean;
  code?: boolean;
  mark?: boolean;
  ellipsis?: boolean;
} & WithChildren<JNode>;
function textClass(
  tone: TypographyProps['tone'],
  strong?: boolean,
  italic?: boolean,
  underline?: boolean,
  deleted?: boolean,
  code?: boolean,
  mark?: boolean,
  ellipsis?: boolean,
  className?: string,
) {
  return cx(
    'ja-typography',
    tone,
    strong && 'strong',
    italic && 'italic',
    underline && 'underline',
    deleted && 'deleted',
    code && 'code',
    mark && 'mark',
    ellipsis && 'ellipsis',
    className,
  );
}
export function Text(props: TypographyProps) {
  return (
    <span
      className={textClass(
        props.tone,
        props.strong,
        props.italic,
        props.underline,
        props.deleted,
        props.code,
        props.mark,
        props.ellipsis,
        props.className,
      )}
      style={props.style}
    >
      {props.children}
    </span>
  );
}
export function Paragraph(props: TypographyProps) {
  return (
    <p
      className={cx(
        'ja-paragraph',
        textClass(
          props.tone,
          props.strong,
          props.italic,
          props.underline,
          props.deleted,
          props.code,
          props.mark,
          props.ellipsis,
          props.className,
        ),
      )}
      style={props.style}
    >
      {props.children}
    </p>
  );
}
interface HeadingProps extends WithChildren<JNode> {
  className?: string;
  style?: string;
}
function H1(props: HeadingProps) {
  return (
    <h1 className={props.className} style={props.style}>
      {props.children}
    </h1>
  );
}
function H2(props: HeadingProps) {
  return (
    <h2 className={props.className} style={props.style}>
      {props.children}
    </h2>
  );
}
function H3(props: HeadingProps) {
  return (
    <h3 className={props.className} style={props.style}>
      {props.children}
    </h3>
  );
}
function H4(props: HeadingProps) {
  return (
    <h4 className={props.className} style={props.style}>
      {props.children}
    </h4>
  );
}
function H5(props: HeadingProps) {
  return (
    <h5 className={props.className} style={props.style}>
      {props.children}
    </h5>
  );
}
const headings = [H1, H2, H3, H4, H5];
function headingFor(level: 1 | 2 | 3 | 4 | 5 = 1) {
  return headings[level - 1];
}
export type TitleProps = TypographyProps & { level?: 1 | 2 | 3 | 4 | 5 };
export function Title(props: TitleProps) {
  return (
    <Dynamic
      fc={headingFor(props.level)}
      className={cx(
        'ja-title',
        textClass(
          props.tone,
          props.strong,
          props.italic,
          props.underline,
          props.deleted,
          props.code,
          props.mark,
          props.ellipsis,
          props.className,
        ),
      )}
      style={props.style}
    >
      {props.children}
    </Dynamic>
  );
}
export type LinkProps = TypographyProps & {
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
  disabled?: boolean;
  ariaLabel?: string;
};
export function Link(props: LinkProps) {
  return (
    <a
      href={props.disabled ? undefined : props.href}
      target={props.target}
      rel={props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined)}
      aria-label={props.ariaLabel}
      aria-disabled={props.disabled || undefined}
      tabIndex={props.disabled ? -1 : undefined}
      className={cx(
        'ja-link',
        textClass(
          props.tone,
          props.strong,
          props.italic,
          props.underline,
          props.deleted,
          props.code,
          props.mark,
          props.ellipsis,
          props.className,
        ),
        props.disabled && 'disabled',
      )}
      style={props.style}
      on:click={(evt) => {
        if (props.disabled) evt.preventDefault();
      }}
    >
      {props.children}
    </a>
  );
}
