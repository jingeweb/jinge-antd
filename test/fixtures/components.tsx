import { expose, vm, Transition, type JNode, type WithOptChildren, type WithSlots } from 'jinge';

import {
  Form,
  DatePicker,
  Table,
  type TableRowSelection,
  Pagination,
  FormField,
  type FormInstance,
  Select,
  AutoComplete,
  Checkbox,
  Switch,
  Button,
  ButtonGroup,
  Controller,
  Floating,
  type FormControl,
  Input,
  Modal,
  Drawer,
  Popover,
  useConfirmContext,
  type ConfirmCallback,
} from '../../src';

export * from '../../src';
export * as publicComponents from '../../src';
// Direct imports for internal SVG tests; these are not part of the library's public API.
export * from '../../src/_icon';
export { autoUpdate } from '../../src/floating/autoupdate';
export { InputInner } from '../../src/input/inner';
export { calcPosition, getDelayOpt, getPlacementOpt } from '../../src/floating/common';
export { isPointInPolygon, isPointInPolygon2 } from '../../src/floating/safe-polygon';

export function BodySlot() {
  return <strong data-testid="body-slot">slot body</strong>;
}

export function NativeAutocompleteProbe(props: { autoComplete: string }) {
  return <input autoComplete={props.autoComplete} />;
}

export function ProgressInfoSlot(props: { percent: number; status: string }) {
  return (
    <strong>
      {props.percent}:{props.status}
    </strong>
  );
}
export function TriggerSlot() {
  return <button data-testid="trigger">trigger</button>;
}
export function ContentSlot() {
  return <span data-testid="content-slot">custom content</span>;
}
export function FooterSlot() {
  return <button data-testid="footer-slot">custom footer</button>;
}
export function IconSlot() {
  return <i data-testid="icon-slot">icon</i>;
}
export function ControllerField(props: {
  name: 'first' | 'second';
  control: FormControl<{ first: string; second: string }>;
}) {
  return (
    <Controller name={props.name} control={props.control}>
      {(field) => (
        <Input
          ref={field.ref}
          value={field.value}
          on:change={field['on:change']}
          on:blur={field['on:blur']}
        />
      )}
    </Controller>
  );
}
export function CellSlot(props: { data: { name: string }; rowIndex: number }) {
  return (
    <em>
      {props.rowIndex}:{props.data.name}
    </em>
  );
}
export function TitleSlot(props: { index: number }) {
  return <span>column {props.index}</span>;
}
export function ConfirmProbe(props: {
  listener: ConfirmCallback<unknown>;
  capture: (ctx: ReturnType<typeof useConfirmContext<unknown>>) => void;
}) {
  const ctx = useConfirmContext<unknown>(Symbol('test-confirm'), async () => undefined);
  ctx.onConfirmFns.add(props.listener);
  props.capture(ctx);
  return <div>confirm probe</div>;
}
export function NestedButtons() {
  return <Button>group button</Button>;
}

export function GroupProbe(props: { size?: 'sm' | 'md' | 'lg'; disabled?: boolean }) {
  return (
    <ButtonGroup size={props.size} disabled={props.disabled} ariaLabel="Actions">
      <Button>Inherited</Button>
      <Button size="lg">Explicit</Button>
    </ButtonGroup>
  );
}

export function TransitionProbe(props: { state: { open: boolean } }) {
  return (
    <Transition isEnter={props.state.open} destroyAfterLeave>
      <div data-testid="transition-probe">probe</div>
    </Transition>
  );
}

export function FocusContentSlot() {
  return <input aria-label="Popup field" />;
}
export function NestedFloating(props: { initiallyOpen?: boolean }) {
  return (
    <Floating
      defaultOpen={props.initiallyOpen}
      zIndex={10}
      slot:trigger={<button id="parent-trigger">Parent</button>}
    >
      <button id="parent-action">Parent action</button>
      <Floating
        defaultOpen={props.initiallyOpen}
        zIndex={20}
        slot:trigger={<button id="child-trigger">Child</button>}
      >
        <button id="child-action">Child action</button>
      </Floating>
    </Floating>
  );
}

export function InitialDialogs() {
  return (
    <Modal title="Initial parent">
      <input aria-label="Parent field" />
      <Drawer defaultOpen title="Initial child">
        <input aria-label="Child field" />
      </Drawer>
    </Modal>
  );
}

export function BackgroundPopup(props: { open: boolean }) {
  return (
    <>
      <Modal title="Background">
        <Popover open={props.open} content="Background popup">
          <button>Popup trigger</button>
        </Popover>
      </Modal>
      <Modal title="Foreground">
        <input aria-label="Foreground field" />
      </Modal>
    </>
  );
}

export function SlotFallbackProbe(props: WithOptChildren<JNode> & WithSlots<{ icon?: JNode }>) {
  return (
    <div data-testid="slot-fallback-probe">
      {props.children ?? props['slot:icon'] ?? 'fallback'}
    </div>
  );
}

export function NestedInputConfigProbe(props: { config: { disabled: boolean } }) {
  return <input disabled={props.config.disabled} />;
}

export function NestedInputConfigParent(props: { disabled: boolean }) {
  return <NestedInputConfigProbe config={props} />;
}

export function BooleanController(props: {
  control: FormControl<{ accepted: boolean }>;
  kind: 'checkbox' | 'switch';
}) {
  return (
    <Controller name="accepted" control={props.control}>
      {(field) =>
        props.kind === 'checkbox' ? (
          <Checkbox
            label="Accepted"
            checked={field.value ?? false}
            on:change={field['on:change']}
            on:blur={field['on:blur']}
          />
        ) : (
          <Switch
            label="Accepted"
            checked={field.value ?? false}
            on:change={field['on:change']}
            on:blur={field['on:blur']}
          />
        )
      }
    </Controller>
  );
}

export function SelectLabelSlot(props: { option: { label: string } }) {
  return <strong>{props.option.label}</strong>;
}
export function DynamicOptionSlotProbe(props: {
  option: { label: string } & WithSlots<{ label?: JNode }>;
}) {
  return (
    <div data-testid="dynamic-option-slot">{props.option['slot:label'] ?? props.option.label}</div>
  );
}

export function SelectController(props: {
  control: FormControl<{ selection: number | undefined }>;
}) {
  return (
    <Controller name="selection" control={props.control}>
      {(field) => (
        <Select
          placeholder="Choose"
          value={field.value ?? null}
          options={[
            { value: 0, label: 'Zero' },
            { value: 2, label: 'Two' },
          ]}
          on:change={field['on:change']}
          on:blur={field['on:blur']}
        />
      )}
    </Controller>
  );
}
export function AutoCompleteController(props: { control: FormControl<{ text: string }> }) {
  return (
    <Controller name="text" control={props.control}>
      {(field) => (
        <AutoComplete
          options={[]}
          value={field.value ?? ''}
          on:change={field['on:change']}
          on:blur={field['on:blur']}
        />
      )}
    </Controller>
  );
}

export function FormViewProbe(props: {
  form: FormInstance<{ name: string }>;
  finish?: (data: { name: string }) => void;
}) {
  return (
    <Form form={props.form} on:finish={props.finish} ariaLabel="Customer form">
      <FormField
        name="name"
        control={props.form.control}
        label="Customer"
        help="Customer help"
        required
      >
        {(field) => (
          <Input
            id={field.id}
            name={field.name}
            value={field.value ?? ''}
            on:change={field['on:change']}
            on:blur={field['on:blur']}
            disabled={field.disabled}
            ariaDescribedby={field.ariaDescribedby}
            ariaInvalid={field.invalid}
          />
        )}
      </FormField>
    </Form>
  );
}
export function DynamicFormProbe(props: {
  form: FormInstance<{ name?: string }>;
  visible: boolean;
  preserve: boolean;
}) {
  const state = vm({ visible: props.visible });
  expose({
    hide: () => {
      state.visible = false;
    },
    show: () => {
      state.visible = true;
    },
  });
  return (
    <Form form={props.form}>
      {state.visible && (
        <FormField
          name="name"
          control={props.form.control}
          label="Dynamic"
          preserve={props.preserve}
        >
          {(field) => (
            <Input id={field.id} value={field.value ?? ''} on:change={field['on:change']} />
          )}
        </FormField>
      )}
    </Form>
  );
}

export function FormTriggerProbe(props: { form: FormInstance<{ name: string }> }) {
  return (
    <Form form={props.form}>
      <FormField name="name" control={props.form.control} validateTrigger="submit" label="Name">
        {(field) => (
          <Input
            id={field.id}
            value={field.value ?? ''}
            disabled={field.disabled}
            on:change={field['on:change']}
            on:blur={field['on:blur']}
          />
        )}
      </FormField>
    </Form>
  );
}

export function ForBoundaryProbe(props: { items: string[] }) {
  return (
    <>
      {props.items.map((item, index) => (
        <span key={item} data-first={index === 0} data-last={index === props.items.length - 1}>
          {item}
        </span>
      ))}
    </>
  );
}

export function TableExpandedSlot(props: { data: { name: string } }) {
  return <span>Details:{props.data.name}</span>;
}

export function PaginationFormFixture() {
  return (
    <form>
      <Pagination total={100} defaultPageSize={20} showSizeChanger />
    </form>
  );
}

function ObjectCallbackChild(props: {
  config: { active: boolean; test(item: { id: number }): boolean };
}) {
  return <span>{props.config.test({ id: 1 }) ? 'matched' : 'missed'}</span>;
}
export function ReactiveObjectCallbackProbe(props: { active: boolean }) {
  return <ObjectCallbackChild config={{ active: props.active, test: (item) => item.id === 1 }} />;
}
export function TableStableSelectionFixture() {
  const selection = vm<TableRowSelection<{ id: number; name: string }>>({ selectedRowKeys: [] });
  expose({
    choose: () => {
      selection.selectedRowKeys = [1];
    },
  });
  return (
    <Table
      rowKey="id"
      data={[{ id: 1, name: 'Ada' }]}
      columns={[{ key: 'name', title: 'Name', dataIndex: 'name' }]}
      rowSelection={selection}
    />
  );
}

export function DatePickerFormFixture() {
  const initial = Temporal.PlainDate.from('2026-11-03');
  return (
    <form>
      <DatePicker defaultValue={initial} name="date" />
    </form>
  );
}

export function DatePickerControllerFixture(props: {
  form: FormInstance<{ date: Temporal.PlainDate | null }>;
}) {
  return (
    <Form form={props.form}>
      <Controller name="date" control={props.form.control}>
        {(field) => (
          <DatePicker
            value={field.value ?? null}
            id={field.id}
            ariaLabel="Form date"
            on:change={field['on:change']}
            on:blur={field['on:blur']}
          />
        )}
      </Controller>
    </Form>
  );
}

export function DataChildrenProbe(props: { nodes: { children: { label: string }[] }[] }) {
  const config = { children: (node: { children: { label: string }[] }) => node.children };
  const children = config.children(props.nodes[0]);
  return <span>{children[0].label}</span>;
}

const methodCallLabels = ['Alpha', 'Beta'];
export function MemberCallProbe(props: { query: string }) {
  return (
    <span>
      {methodCallLabels.some((label) => label === props.query)}:{props.query.trim()}
    </span>
  );
}

export function FieldRefProbe(props: {
  form: FormInstance<{ name?: string }>;
  focus?: () => void;
  native?: boolean;
}) {
  const state = vm({ visible: true });
  expose({
    hide: () => {
      state.visible = false;
    },
    show: () => {
      state.visible = true;
    },
  });
  return (
    <Controller name="name" control={props.form.control} focus={props.focus}>
      {(field) => (
        <>
          {state.visible &&
            (props.native ? (
              <input ref={field.ref} />
            ) : (
              <Input ref={field.ref} value={field.value ?? ''} />
            ))}
        </>
      )}
    </Controller>
  );
}
