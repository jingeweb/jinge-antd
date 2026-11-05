import { bootstrap, type FC, vm, onUnmount } from 'jinge';
import { z } from 'zod';

import {
  Tree,
  type TreeNode,
  Cascader,
  type CascaderOption,
  type CascaderValue,
  Upload,
  type UploadFile,
  type UploadRequestOptions,
  Breadcrumb,
  Menu,
  Form,
  FormField,
  useForm,
  AutoComplete,
  Switch,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Button,
  Alert,
  Spin,
  Skeleton,
  Progress,
  Result,
  type ResultStatus,
  Card,
  Collapse,
  type CollapseItem,
  Descriptions,
  type DescriptionItem,
  Empty,
  Avatar,
  Badge,
  Tag,
  ButtonGroup,
  Dropdown,
  Drawer,
  Floating,
  type FloatingPlacement,
  type FloatingTrigger,
  NestedFloating,
  Input,
  TextArea,
  Password,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Table,
  type ColumnType,
  type TableKey,
  type TableRowSelection,
  Pagination,
  DatePicker,
  RangePicker,
  TimePicker,
  type DateRange,
  Tabs,
  Segmented,
  Steps,
  Tooltip,
  message,
  notification,
  type MessageInstance,
  type NotificationInstance,
  type NotificationPlacement,
} from '../../fixtures/components';
import './style.css';

const state = vm({
  second: false,
  open: false,
  tab: 'b',
  name: 'Ada',
  number: 2 as number | undefined,
});
const events: unknown[] = [];
const inputLab = vm({ value: 'Ada', prefix: '$' });
const containers = vm({ loading: false, actions: 0 });
const avatarSource = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="blue"/></svg>')}`;
const display = vm({ src: avatarSource, count: 99, dot: false, tag: true });
let activeMessage: MessageInstance | undefined;
let activeNotice: NotificationInstance | undefined;
const noticeLab = vm({ placement: 'topRight' as NotificationPlacement, open: false });
const dialogLab = vm({
  open: false,
  drawer: false,
  placement: 'right' as 'left' | 'right' | 'top' | 'bottom',
  long: false,
});
const query = new URLSearchParams(location.search);
const lab = vm({
  open: false,
  placement: 'bottom' as FloatingPlacement,
  offset: 10,
  disabled: false,
  wide: false,
  mode: (query.get('mode') ?? 'click') as FloatingTrigger,
});
let resolvePending: ((value: boolean) => void) | undefined;
const tabOptions = vm([
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
]);
const rows = vm([
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]);

// Textbook UI interactions are exposed as buttons; only layout mutations use this test seam.
Object.assign(window, {
  testApp: {
    inputLab,
    state,
    events,
    lab,
    dialogLab,
    resolveConfirm(value: boolean) {
      resolvePending?.(value);
    },
    prependTab() {
      tabOptions.unshift({ key: 'prefix', label: 'A much longer preceding tab' });
    },
    reverseRows() {
      rows.reverse();
    },
  },
});

function Layers() {
  return (
    <>
      <Modal
        open={true}
        className="lower-modal"
        maskClassName="lower-mask"
        title="Lower"
        footer={false}
      >
        <span>lower content</span>
        <button
          id="open-second"
          on:click={() => {
            state.second = true;
          }}
        >
          open second
        </button>
      </Modal>
      <Modal
        open={state.second}
        className="upper-modal"
        maskClassName="upper-mask"
        title="Upper"
        footer={false}
      >
        <span>upper content</span>
      </Modal>
    </>
  );
}
function DialogLab() {
  return (
    <>
      <button id="outside-dialog">Outside</button>
      <Button
        id="open-modal"
        on:click={() => {
          dialogLab.open = true;
        }}
      >
        Edit customer
      </Button>
      <Modal
        open={dialogLab.open}
        title="Edit customer"
        on:openChange={(open) => {
          dialogLab.open = open;
        }}
        on:cancel={() => {
          events.push('cancel');
        }}
        on:afterClose={(value) => {
          events.push(value ?? 'closed');
        }}
        on:confirm={() => {
          events.push('submit');
          return new Promise<boolean>((resolve) => {
            resolvePending = resolve;
          });
        }}
      >
        <input aria-label="Customer name" />
        <button
          id="open-drawer"
          on:click={() => {
            dialogLab.drawer = true;
          }}
        >
          Open details
        </button>
        <Popover
          autoFocus
          ariaLabel="Dialog popover"
          slot:content={<input aria-label="Portal field" />}
        >
          <Button id="dialog-popover">Edit in popup</Button>
        </Popover>
        {dialogLab.long && <div style="height:1600px">Long modal content</div>}
        <Drawer
          open={dialogLab.drawer}
          title="Customer details"
          placement={dialogLab.placement}
          on:openChange={(open) => {
            dialogLab.drawer = open;
          }}
          slot:footer={
            <button
              id="drawer-done"
              on:click={() => {
                dialogLab.drawer = false;
              }}
            >
              Done
            </button>
          }
        >
          <input aria-label="Drawer field" />
          <div style="height:1200px">Scrollable details</div>
        </Drawer>
      </Modal>
    </>
  );
}
function NoticeLab() {
  function showNotification(duration = 0) {
    activeNotice = notification.info({
      title: 'Import complete',
      placement: noticeLab.placement,
      duration,
      'slot:content': (
        <div>
          <p>Details about the imported customers. Long content should wrap within the viewport.</p>
          <input aria-label="Notification field" />
        </div>
      ),
      'slot:actions': (
        <Button
          on:click={() => {
            events.push('viewed');
            activeNotice?.close();
          }}
        >
          View results
        </Button>
      ),
    });
  }
  return (
    <div style="padding-top:80px">
      <input aria-label="Page field" />
      <Button
        on:click={() => {
          activeMessage = message.loading({ content: 'Importing', duration: 0 });
        }}
      >
        Show loading message
      </Button>
      <Button
        on:click={() => {
          activeMessage?.update({ type: 'success', content: 'Import finished', duration: 0 });
        }}
      >
        Update message
      </Button>
      <Button on:click={() => message.clear()}>Clear messages</Button>
      <select
        aria-label="Notification placement"
        on:change={(event) => {
          noticeLab.placement = (event.target as HTMLSelectElement).value as NotificationPlacement;
        }}
      >
        <option value="topRight">topRight</option>
        <option value="topLeft">topLeft</option>
        <option value="bottomRight">bottomRight</option>
        <option value="bottomLeft">bottomLeft</option>
      </select>
      <Button on:click={() => showNotification()}>Show notification</Button>
      <Button on:click={() => showNotification(400)}>Timed notification</Button>
      <Button on:click={() => notification.clear()}>Clear notifications</Button>
      <Button
        on:click={() => {
          noticeLab.open = true;
        }}
      >
        Open feedback modal
      </Button>
      <Modal
        open={noticeLab.open}
        title="Feedback modal"
        footer={false}
        on:openChange={(open) => {
          noticeLab.open = open;
        }}
      >
        <Button
          on:click={() => {
            message.success({ content: 'Saved inside modal', duration: 0 });
            showNotification();
          }}
        >
          Show feedback
        </Button>
      </Modal>
    </div>
  );
}
function DisplayLab() {
  return (
    <div>
      <Avatar src={display.src} alt="Test avatar" size={48}>
        AB
      </Avatar>
      <Button
        on:click={() => {
          display.src = 'data:image/png;base64,broken';
        }}
      >
        Use broken image
      </Button>
      <Button
        on:click={() => {
          display.src = avatarSource;
        }}
      >
        Retry image
      </Button>
      <Badge count={display.count} dot={display.dot}>
        <button id="badge-child">Inbox</button>
      </Badge>
      <Button
        on:click={() => {
          display.count++;
        }}
      >
        Increment count
      </Button>
      <Button
        on:click={() => {
          display.dot = !display.dot;
        }}
      >
        Toggle dot
      </Button>
      <Tag
        closable
        visible={display.tag}
        on:visibleChange={(visible) => {
          display.tag = visible;
        }}
      >
        Filter tag
      </Tag>
      <Tag closable closeLabel="Keep fixed tag" on:close={(event) => event.preventDefault()}>
        Fixed tag
      </Tag>
      <Button
        on:click={() => {
          display.tag = true;
        }}
      >
        Restore tag
      </Button>
    </div>
  );
}
function HoverPolygon() {
  return (
    <div className="scroll-stage">
      <div className="scroll-trigger">
        <Floating
          open={state.open}
          on:openChange={(value) => {
            events.push(value);
            state.open = value;
          }}
          triggerMethod="hover"
          delay={0}
          safePolygon
          placement="bottom"
          zIndex={500}
          slot:trigger={<button id="polygon-trigger">hover target</button>}
        >
          <div id="polygon-content">interactive floating content</div>
        </Floating>
      </div>
    </div>
  );
}
function TabLayout() {
  return (
    <Tabs
      activeKey={state.tab}
      options={tabOptions}
      on:change={(value) => {
        state.tab = value;
      }}
    />
  );
}
function Forms() {
  return (
    <>
      <Input
        value={state.name}
        on:change={(value) => {
          state.name = value;
        }}
      />
      <InputNumber
        value={state.number}
        on:change={(value) => {
          state.number = value;
        }}
      />
      <output id="form-output">
        {state.name}:{state.number}
      </output>
      <Button
        on:click={() => {
          state.name = 'Reset';
          state.number = 7;
        }}
      >
        reset
      </Button>
    </>
  );
}
function Selection() {
  return (
    <>
      <Select
        placeholder="Choose"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        on:change={(value) => {
          events.push(value);
        }}
      />
      <Dropdown
        options={[{ value: 'x', label: 'Extra' }]}
        on:change={(value) => {
          events.push(value);
        }}
      >
        <Button>dropdown trigger</Button>
      </Dropdown>
    </>
  );
}
function Overlays() {
  return (
    <>
      <Popover content="Popover body">
        <Button>popover trigger</Button>
      </Popover>
      <Tooltip content="Tooltip body">
        <Button>tooltip trigger</Button>
      </Tooltip>
      <Popconfirm
        title="Confirm action?"
        on:confirm={() => {
          events.push('confirmed');
        }}
      >
        <Button>confirm trigger</Button>
      </Popconfirm>
      <Button
        on:click={() => {
          message.success({ content: 'Saved', duration: 0 });
        }}
      >
        show message
      </Button>
    </>
  );
}
function Dialog() {
  return (
    <>
      <Button
        on:click={() => {
          state.open = true;
        }}
      >
        open dialog
      </Button>
      <Modal
        open={state.open}
        title="Test dialog"
        confirmValue="accepted"
        on:openChange={(value) => {
          state.open = value;
        }}
        on:afterClose={(result) => {
          events.push(result);
        }}
      >
        <Input placeholder="Dialog input" />
      </Modal>
    </>
  );
}
function Rows() {
  return (
    <Table rowKey="id" data={rows} columns={[{ key: 'name', title: 'Name', dataIndex: 'name' }]} />
  );
}
function Buttons() {
  return (
    <div>
      <form
        on:submit={(evt) => {
          evt.preventDefault();
          events.push('submitted');
        }}
      >
        <input aria-label="Native field" name="record" />
        <Button>Ordinary action</Button>
        <Button htmlType="submit" name="action" value="save">
          Submit action
        </Button>
        <Button htmlType="reset">Reset action</Button>
      </form>
      <Button
        ariaLabel="Keyboard action"
        on:click={() => {
          events.push('clicked');
        }}
      >
        Keyboard
      </Button>
      <Button disabled loading={false}>
        Disabled action
      </Button>
      <ButtonGroup disabled={state.second} ariaLabel="Actions">
        <Button>Grouped action</Button>
      </ButtonGroup>
      <Button
        on:click={() => {
          state.second = !state.second;
        }}
      >
        Toggle group
      </Button>
    </div>
  );
}
function FloatingLab() {
  return (
    <div style="min-height:1400px">
      <div id="lab-anchor" style="margin-top:240px;margin-left:240px;width:max-content">
        <Floating
          open={lab.open}
          on:openChange={(value) => {
            lab.open = value;
            events.push(value);
          }}
          placement={lab.placement}
          offset={lab.offset}
          disabled={lab.disabled}
          triggerMethod={lab.mode}
          safePolygon
          delay={{ open: 80, close: 40 }}
          zIndex={500}
          ariaLabel="Floating lab"
          slot:trigger={<button id="lab-trigger">Lab trigger</button>}
        >
          <div
            id="lab-content"
            style={lab.wide ? 'width:1500px;height:1000px' : 'width:180px;min-height:80px'}
          >
            <button
              id="rapid-close"
              on:click={() => {
                lab.open = false;
              }}
            >
              Close immediately
            </button>
            <input aria-label="Lab input" />
          </div>
        </Floating>
      </div>
    </div>
  );
}
function ScrollFloating() {
  return (
    <div
      id="scroll-box"
      style="height:180px;width:400px;overflow:auto;margin-top:120px;border:1px solid #ddd"
    >
      <div style="height:700px;padding-top:180px;padding-left:80px">
        <Floating
          zIndex={500}
          placement="bottom"
          ariaLabel="Scroll panel"
          slot:trigger={<button id="scroll-trigger">Scroll trigger</button>}
        >
          <div style="width:160px;height:40px">Anchored content</div>
        </Floating>
      </div>
    </div>
  );
}
function NestedPortals() {
  return <NestedFloating />;
}
function OverlayLab() {
  return (
    <div className="demo-stack">
      <Tooltip content="Keyboard help">
        <Button>Keyboard tooltip</Button>
      </Tooltip>
      <Popover
        autoFocus
        ariaLabel="Editable details"
        slot:content={
          <div>
            <input aria-label="Popover field" />
            <Button>Inside action</Button>
          </div>
        }
      >
        <Button>Editable popover</Button>
      </Popover>
      <Popconfirm
        title="Async action?"
        content="Wait for confirmation"
        on:confirm={() => {
          events.push('submit');
          return new Promise<boolean>((resolve) => {
            resolvePending = resolve;
          });
        }}
      >
        <Button>Async confirm</Button>
      </Popconfirm>
    </div>
  );
}
function CardLab() {
  return (
    <Card
      title="Account"
      loading={containers.loading}
      slot:extra={
        <Button
          on:click={() => {
            containers.loading = !containers.loading;
          }}
        >
          Toggle card loading
        </Button>
      }
      slot:actions={
        <Button
          on:click={() => {
            containers.actions++;
          }}
        >
          Card action
        </Button>
      }
    >
      <input aria-label="Card note" />
      <output id="card-actions">{containers.actions}</output>
    </Card>
  );
}
function CollapseLab() {
  const state = vm({ keys: [] as string[], accordion: false, destroy: false, extra: 0 });
  const items = vm<CollapseItem[]>([
    {
      key: 'profile',
      label: 'Profile',
      'slot:content': <input aria-label="Collapse note" />,
      'slot:extra': (
        <Button
          on:click={() => {
            state.extra++;
          }}
        >
          Extra action
        </Button>
      ),
    },
    { key: 'disabled', label: 'Disabled panel', disabled: true },
    { key: 'security', label: 'Security', content: 'Security details' },
  ]);
  return (
    <>
      <Button
        on:click={() => {
          state.accordion = !state.accordion;
        }}
      >
        Toggle accordion
      </Button>
      <Button
        on:click={() => {
          state.destroy = !state.destroy;
        }}
      >
        Toggle destroy
      </Button>
      <Button on:click={() => items.reverse()}>Reverse panels</Button>
      <Collapse
        items={items}
        activeKeys={state.keys}
        on:change={(keys) => {
          state.keys = keys;
        }}
        accordion={state.accordion}
        destroyOnHidden={state.destroy}
      />
      <output id="collapse-extra">{state.extra}</output>
    </>
  );
}
function DescriptionsLab() {
  const state = vm({ vertical: false });
  const items = vm<DescriptionItem[]>([
    { key: 'name', label: 'Name', content: 'Ada' },
    { key: 'count', label: 'Count', content: 0 },
    { key: 'note', label: 'Note', content: null },
    { key: 'company', label: 'Company', content: 'Example company', span: 2 },
    { key: 'address', label: 'Address', content: 'LongUnbrokenAddress'.repeat(15), span: 'filled' },
  ]);
  return (
    <>
      <Button
        on:click={() => {
          state.vertical = !state.vertical;
        }}
      >
        Toggle details layout
      </Button>
      <Descriptions
        title="Customer details"
        items={items}
        bordered
        column={{ xs: 1, sm: 2, lg: 3 }}
        layout={state.vertical ? 'vertical' : 'horizontal'}
        slot:extra={
          <Button
            on:click={() => {
              items[1].content = Number(items[1].content) + 1;
            }}
          >
            Add quota
          </Button>
        }
      />
    </>
  );
}
function EmptyLab() {
  const state = vm({ broken: false, created: false });
  return (
    <>
      <Button
        on:click={() => {
          state.broken = !state.broken;
        }}
      >
        Toggle empty image
      </Button>
      <Button
        on:click={() => {
          state.created = false;
        }}
      >
        Reset empty
      </Button>
      {state.created ? (
        <p role="status">Created 1 customer</p>
      ) : (
        <Empty
          announce
          description="No customers"
          image={state.broken ? 'data:image/png;base64,broken' : avatarSource}
          on:error={() => {
            events.push('empty-error');
          }}
        >
          <Button
            on:click={() => {
              state.created = true;
            }}
          >
            Create customer
          </Button>
        </Empty>
      )}
    </>
  );
}
function AlertLab() {
  const state = vm({ visible: true, retries: 0 });
  return (
    <>
      <Button
        on:click={() => {
          state.visible = true;
        }}
      >
        Restore alert
      </Button>
      <Alert
        title="Notice"
        closable
        visible={state.visible}
        on:visibleChange={(visible) => {
          state.visible = visible;
        }}
        slot:action={
          <Button
            on:click={() => {
              state.retries++;
            }}
          >
            Retry alert
          </Button>
        }
      />
      <Alert
        title="Fixed notice"
        type="warning"
        closable
        closeLabel="Keep alert"
        on:close={(event) => event.preventDefault()}
      />
      <output id="alert-retries">{state.retries}</output>
    </>
  );
}
function SpinLab() {
  const state = vm({ busy: false });
  return (
    <>
      <Button
        on:click={() => {
          state.busy = !state.busy;
        }}
      >
        Toggle busy
      </Button>
      <Spin spinning={state.busy} delay={120} tip="Fetching">
        <input aria-label="Busy field" />
      </Spin>
      <Button>After loading</Button>
    </>
  );
}
function SkeletonLab() {
  const state = vm({ loading: true });
  return (
    <>
      <Button
        on:click={() => {
          state.loading = !state.loading;
        }}
      >
        Toggle skeleton
      </Button>
      <Skeleton loading={state.loading} avatar active>
        <input aria-label="Skeleton field" />
      </Skeleton>
    </>
  );
}
function ProgressLab() {
  const state = vm({ percent: 25 });
  return (
    <>
      <Button
        on:click={() => {
          state.percent = Math.min(100, state.percent + 25);
        }}
      >
        Advance progress
      </Button>
      <Progress ariaLabel="Upload progress" percent={state.percent} />
      <div style="width:96px">
        <Progress ariaLabel="Circle progress" type="circle" percent={state.percent} width={160} />
      </div>
      <Progress ariaLabel="Active task" percent={40} status="active" />
    </>
  );
}
function ResultLab() {
  const state = vm({ status: 'success' as ResultStatus, retries: 0 });
  return (
    <>
      <select
        aria-label="Result status"
        value={state.status}
        on:change={(event) => {
          state.status = (event.target as HTMLSelectElement).value as ResultStatus;
        }}
      >
        <option value="success">success</option>
        <option value="error">error</option>
        <option value="404">404</option>
      </select>
      <Result
        status={state.status}
        slot:extra={
          <Button
            on:click={() => {
              state.retries++;
              state.status = 'success';
            }}
          >
            Retry result
          </Button>
        }
      >
        Job EX-2026-001
      </Result>
      <output id="result-retries">{state.retries}</output>
    </>
  );
}
function InputLab() {
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push({
          type: 'submit',
          data: [...new FormData(event.target as HTMLFormElement).entries()],
        });
      }}
    >
      <span id="input-help">Customer details</span>
      <Input
        ariaLabel="Customer name"
        ariaDescribedby="input-help"
        name="customer"
        value={inputLab.value}
        on:change={(value) => {
          events.push({ type: 'change', value });
          inputLab.value = value;
        }}
        on:pressEnter={() => {
          events.push({ type: 'enter' });
        }}
        prefix={inputLab.prefix}
        allowClear
        showCount
        maxLength={20}
      />
      <Input ariaLabel="Uncontrolled note" name="note" defaultValue="Initial" />
      <Button htmlType="reset">Reset input form</Button>
      <Button htmlType="submit">Submit input form</Button>
    </form>
  );
}
function TextAreaLab() {
  const state = vm({ note: '' });
  return (
    <TextArea
      ariaLabel="Multiline notes"
      value={state.note}
      on:change={(value) => {
        state.note = value;
      }}
      autoSize={{ minRows: 2, maxRows: 4 }}
      allowClear
      showCount
      maxLength={200}
    />
  );
}
function NumberLab() {
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push({
          type: 'submit',
          data: Array.from(new FormData(event.target as HTMLFormElement).entries()),
        });
      }}
    >
      <InputNumber
        ariaLabel="Amount"
        name="amount"
        defaultValue={0.1}
        step={0.1}
        min={0}
        max={10}
        precision={2}
        on:change={(value) => {
          events.push({ type: 'number', value: value ?? null });
        }}
      />
      <Button htmlType="reset">Reset number form</Button>
      <Button htmlType="submit">Submit number form</Button>
    </form>
  );
}
function PasswordLab() {
  return (
    <Password
      ariaLabel="Account password"
      defaultValue="Example123"
      autoComplete="current-password"
      on:change={(value) => {
        events.push(value);
      }}
    />
  );
}
function BreadcrumbLab() {
  return (
    <Breadcrumb
      ariaLabel="Page path"
      separator="›"
      items={[
        { key: 'home', label: 'Home path', href: '#home' },
        { key: 'blocked', label: 'Blocked path', href: '#blocked', disabled: true },
        { key: 'projects', label: 'Projects path', href: '#projects' },
        { key: 'current', label: 'Ada detail', href: '#ignored' },
      ]}
      on:click={(item) => {
        events.push(item.key);
      }}
    />
  );
}
function DropdownLab() {
  const state = vm({ disabled: false });
  return (
    <>
      <Dropdown
        ariaLabel="Actions menu"
        disabled={state.disabled}
        options={[
          { value: 'edit', label: 'Edit' },
          { value: 'blocked', label: 'Unavailable', disabled: true },
          { value: 'delete', label: 'Delete', danger: true },
        ]}
        on:change={(value) => {
          events.push(value);
        }}
      >
        <Button>Actions</Button>
      </Dropdown>
      <button type="button">After actions</button>
      <Button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Toggle actions disabled
      </Button>
      <Dropdown
        ariaLabel="Hover actions"
        triggerMethod={['hover', 'focus']}
        options={[{ value: 'hover', label: 'Hover action' }]}
      >
        <Button>Hover trigger</Button>
      </Dropdown>
    </>
  );
}
function DropdownDialogLab() {
  return (
    <Modal title="Dropdown dialog">
      <Dropdown
        options={[
          { value: 'edit', label: 'Dialog edit' },
          { value: 'delete', label: 'Dialog delete' },
        ]}
      >
        <Button>Dialog actions</Button>
      </Dropdown>
    </Modal>
  );
}
function MenuLab() {
  const state = vm({ current: 'home' });
  const options = [
    { value: 'home', label: 'Home' },
    { value: 'blocked', label: 'Blocked', disabled: true },
    {
      value: 'tools',
      label: 'Tools',
      children: [
        { value: 'users', label: 'Users' },
        { value: 'roles', label: 'Roles' },
      ],
    },
  ];
  return (
    <>
      <form
        on:submit={(event) => {
          event.preventDefault();
          events.push('unexpected submit');
        }}
      >
        <Menu
          ariaLabel="Side navigation"
          options={options}
          value={state.current}
          on:change={(value) => {
            state.current = value;
            events.push(value);
          }}
        />
        <Menu
          ariaLabel="Top navigation"
          mode="horizontal"
          options={options}
          on:change={(value) => {
            events.push(value);
          }}
        />
        <button type="button">After menu</button>
      </form>
      <output id="menu-selection">{state.current}</output>
    </>
  );
}
function FormLab() {
  const state = vm({ note: false, fail: false, saves: 0, message: '' });
  const pending = new Map<number, () => void>();
  let disposed = false;
  function delay(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        pending.delete(timer);
        resolve();
      }, ms);
      pending.set(timer, resolve);
    });
  }
  onUnmount(() => {
    disposed = true;
    for (const [timer, resolve] of pending) {
      window.clearTimeout(timer);
      resolve();
    }
    pending.clear();
  });
  const schema = z
    .object({
      name: z.string().trim().min(2, 'Name short'),
      password: z.string().min(3, 'Password short'),
      confirm: z.string(),
      role: z.enum(['viewer', 'editor']),
      enabled: z.boolean(),
      note: z.string().optional(),
    })
    .refine((value) => value.password === value.confirm, {
      path: ['confirm'],
      message: 'Passwords differ',
    });
  const form = useForm(schema, {
    defaultValues: { name: '', password: '', confirm: '', role: 'viewer', enabled: true },
  });
  const status = form.status;
  return (
    <>
      <Form
        form={form}
        ariaLabel="Account form"
        layout="horizontal"
        on:finish={async (data) => {
          const fail = state.fail;
          state.saves++;
          events.push({ type: 'start', data });
          await delay(300);
          if (disposed) return;
          if (fail) throw new Error('Save failed');
          state.message = `Saved ${data.name}`;
          events.push({ type: 'saved' });
        }}
        on:finishFailed={() => {
          events.push({ type: 'invalid' });
        }}
        on:error={() => {
          events.push({ type: 'error' });
        }}
      >
        <FormField
          name="name"
          control={form.control}
          label="Account name"
          help="Two or more characters"
          required
        >
          {(field) => (
            <Input
              ref={field.ref}
              id={field.id}
              name={field.name}
              value={field.value ?? ''}
              disabled={field.disabled}
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="password" control={form.control} label="Account password" required>
          {(field) => (
            <Password
              ref={field.ref}
              id={field.id}
              value={field.value ?? ''}
              disabled={field.disabled}
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField
          name="confirm"
          control={form.control}
          label="Confirm password"
          dependencies={['password']}
          required
        >
          {(field) => (
            <Password
              ref={field.ref}
              id={field.id}
              value={field.value ?? ''}
              disabled={field.disabled}
              ariaDescribedby={field.ariaDescribedby}
              ariaInvalid={field.invalid}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="role" control={form.control} label="Account role">
          {(field) => (
            <Select
              ref={field.ref}
              id={field.id}
              value={field.value ?? null}
              disabled={field.disabled}
              options={[
                { value: 'viewer', label: 'Viewer' },
                { value: 'editor', label: 'Editor' },
              ]}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
        <FormField name="enabled" control={form.control} label="Account enabled">
          {(field) => (
            <Switch
              ref={field.ref}
              id={field.id}
              ariaLabel="Account enabled"
              checked={field.value ?? false}
              disabled={field.disabled}
              on:change={field['on:change']}
            />
          )}
        </FormField>
        {state.note && (
          <FormField name="note" control={form.control} label="Account note" preserve={false}>
            {(field) => (
              <TextArea
                ref={field.ref}
                id={field.id}
                value={field.value ?? ''}
                disabled={field.disabled}
                on:change={field['on:change']}
              />
            )}
          </FormField>
        )}
        <Button htmlType="submit" loading={status.submitting}>
          Save account
        </Button>
        <Button htmlType="reset">Reset account</Button>
      </Form>
      <Button
        on:click={() => {
          state.note = !state.note;
        }}
      >
        Toggle account note
      </Button>
      <Button
        on:click={() => {
          state.fail = !state.fail;
        }}
      >
        Toggle save failure
      </Button>
      <output id="save-count">{state.saves}</output>
      <output id="save-message">{state.message}</output>
    </>
  );
}
function FormRaceLab() {
  const resolvers = new Map<string, ((valid: boolean) => void)[]>();
  onUnmount(() => {
    for (const items of resolvers.values()) for (const resolve of items) resolve(false);
    resolvers.clear();
  });
  const form = useForm(
    z.object({
      name: z.string().refine(
        (value) =>
          new Promise<boolean>((resolve) => {
            const items = resolvers.get(value) ?? [];
            items.push(resolve);
            resolvers.set(value, items);
          }),
        'Name unavailable',
      ),
    }),
    { defaultValues: { name: '' } },
  );
  function resolve(value: string, valid: boolean) {
    for (const done of resolvers.get(value) ?? []) done(valid);
    resolvers.delete(value);
  }
  return (
    <>
      <Form form={form} ariaLabel="Async form">
        <FormField name="name" control={form.control} label="Async name" validateTrigger="change">
          {(field) => (
            <Input
              ref={field.ref}
              id={field.id}
              value={field.value ?? ''}
              ariaInvalid={field.invalid}
              ariaDescribedby={field.ariaDescribedby}
              on:change={field['on:change']}
              on:blur={field['on:blur']}
            />
          )}
        </FormField>
      </Form>
      <Button on:click={() => resolve('new', true)}>Accept latest</Button>
      <Button on:click={() => resolve('old', false)}>Reject old</Button>
    </>
  );
}
function FormDynamicLab() {
  const state = vm({ name: 'first' as 'first' | 'second', visible: true, preserve: true });
  const form = useForm(z.object({ first: z.string().optional(), second: z.string().optional() }), {
    defaultValues: { first: 'First', second: 'Second' },
  });
  return (
    <>
      <Form form={form} ariaLabel="Dynamic form">
        {state.visible && (
          <FormField
            name={state.name}
            control={form.control}
            label="Current field"
            preserve={state.preserve}
          >
            {(field) => (
              <Input
                ref={field.ref}
                id={field.id}
                value={field.value ?? ''}
                on:change={field['on:change']}
                on:blur={field['on:blur']}
              />
            )}
          </FormField>
        )}
      </Form>
      <Button
        on:click={() => {
          state.name = state.name === 'first' ? 'second' : 'first';
        }}
      >
        Swap field
      </Button>
      <Button
        on:click={() => {
          state.visible = !state.visible;
        }}
      >
        Toggle field
      </Button>
      <Button
        on:click={() => {
          state.preserve = false;
        }}
      >
        Discard on unmount
      </Button>
    </>
  );
}
function SelectLongLab() {
  const options = Array.from({ length: 80 }, (_, index) => ({
    value: index,
    label: `Item ${index}`,
    group: `Group ${Math.floor(index / 10)}`,
    disabled: index === 78,
  }));
  return <Select ariaLabel="Long choices" options={options} defaultValue={0} style="width:220px" />;
}
function AutoCompleteLab() {
  const state = vm({
    text: 'Initial',
    loading: false,
    options: [
      { value: 'ada@example.com', label: 'Ada' },
      { value: 'blocked', label: 'Blocked', disabled: true },
      { value: 'grace@example.com', label: 'Grace' },
    ],
  });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push({
          type: 'submit',
          data: Array.from(new FormData(event.target as HTMLFormElement).entries()),
        });
      }}
    >
      <AutoComplete
        ariaLabel="Contact"
        name="contact"
        defaultValue=""
        options={state.options}
        allowClear
        required
        autoComplete="email"
        on:change={(value) => {
          events.push({ type: 'change', value });
        }}
        on:select={(value) => {
          events.push({ type: 'select', value });
        }}
      />
      <AutoComplete
        ariaLabel="Owned text"
        value={state.text}
        options={state.options}
        filterOption={false}
        loading={state.loading}
        on:change={(value) => {
          state.text = value;
        }}
      />
      <Button
        on:click={() => {
          state.loading = !state.loading;
        }}
      >
        Toggle suggestions loading
      </Button>
      <Button
        on:click={() => {
          state.options = [{ value: 'remote@example.com', label: 'Remote' }];
        }}
      >
        Replace suggestions
      </Button>
      <Button htmlType="reset">Reset suggestions</Button>
      <Button htmlType="submit">Submit suggestions</Button>
      <button type="button">After suggestions</button>
    </form>
  );
}
function SelectLab() {
  const state = vm({ value: null as number | null | undefined });
  const options = [
    { value: 0, label: 'Zero' },
    { value: 1, label: 'Blocked', disabled: true },
    { value: 2, label: 'Two', group: 'Numbers' },
  ];
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push(Array.from(new FormData(event.target as HTMLFormElement).entries()));
      }}
    >
      <label htmlFor="select-owner">Owner</label>
      <Select
        id="select-owner"
        name="owner"
        options={options}
        value={state.value}
        required
        allowClear
        placeholder="Choose owner"
        on:change={(value) => {
          state.value = value;
        }}
      />
      <Select
        ariaLabel="Features"
        name="features"
        options={options}
        mode="multiple"
        defaultValue={[0]}
        allowClear
        placeholder="Search features"
      />
      <Select ariaLabel="Rejected" options={options} value={0} />
      <Button htmlType="reset">Reset select form</Button>
      <Button htmlType="submit">Submit select form</Button>
      <button type="button">After selects</button>
    </form>
  );
}
function SelectDialogLab() {
  return (
    <Modal title="Select dialog">
      <Select
        ariaLabel="Dialog choice"
        options={[
          { value: 'a', label: 'Dialog Alpha' },
          { value: 'b', label: 'Dialog Beta' },
        ]}
      />
    </Modal>
  );
}
function SwitchLab() {
  const state = vm({ checked: false, busy: false, disabled: false });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push({
          type: 'submit',
          data: Array.from(new FormData(event.target as HTMLFormElement).entries()),
        });
      }}
    >
      <Switch
        label="Auto save"
        name="save"
        value="yes"
        checked={state.checked}
        loading={state.busy}
        disabled={state.disabled}
        checkedLabel="On"
        uncheckedLabel="Off"
        on:change={(checked, event) => {
          events.push({ type: event.type, checked });
          state.checked = checked;
        }}
      />
      <Switch label="Default notifications" name="notifications" defaultChecked />
      <Button
        on:click={() => {
          state.busy = !state.busy;
        }}
      >
        Toggle busy
      </Button>
      <Button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Toggle disabled
      </Button>
      <Button htmlType="reset">Reset switches</Button>
      <Button htmlType="submit">Submit switches</Button>
    </form>
  );
}
function RadioLab() {
  const state = vm({ value: 'x' as string | undefined, reject: false });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push(Array.from(new FormData(event.target as HTMLFormElement).entries()));
      }}
    >
      <RadioGroup
        legend="Plan"
        name="plan"
        defaultValue="a"
        required
        options={[
          { value: 'a', label: 'Plan Alpha' },
          { value: 'b', label: 'Unavailable', disabled: true },
          { value: 'c', label: 'Plan Gamma' },
        ]}
      />
      <RadioGroup
        legend="View"
        name="view"
        variant="button"
        defaultValue="table"
        options={[
          { value: 'table', label: 'Table view' },
          { value: 'card', label: 'Card view' },
        ]}
      />
      <RadioGroup
        legend="Owned plan"
        name="owned"
        value={state.value}
        options={[
          { value: 'x', label: 'Owned X' },
          { value: 'y', label: 'Owned Y' },
        ]}
        on:change={(value) => {
          if (!state.reject) state.value = value;
        }}
      />
      <Button
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject radio edits
      </Button>
      <Button htmlType="reset">Reset radios</Button>
      <Button htmlType="submit">Submit radios</Button>
    </form>
  );
}
function CheckboxLab() {
  const state = vm({ selected: ['a'], reject: false });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push(Array.from(new FormData(event.target as HTMLFormElement).entries()));
      }}
    >
      <Checkbox label="Agree terms" name="terms" value="yes" required />
      <Checkbox label="Partial" indeterminate />
      <CheckboxGroup
        legend="Features"
        name="features"
        defaultValue={['a']}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Blocked', disabled: true },
        ]}
      />
      <CheckboxGroup
        legend="Controlled"
        name="controlled"
        value={state.selected}
        options={[
          { value: 'a', label: 'Owned Alpha' },
          { value: 'b', label: 'Owned Beta' },
        ]}
        on:change={(values) => {
          if (!state.reject) state.selected = values;
        }}
      />
      <Button
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject checkbox edits
      </Button>
      <Button htmlType="reset">Reset choices</Button>
      <Button htmlType="submit">Submit choices</Button>
    </form>
  );
}
function TabsLab() {
  const state = vm({ vertical: false, manual: false, destroy: false, disabled: false, width: 420 });
  const options = [
    {
      key: 'a',
      label: 'Overview',
      'slot:content': <input aria-label="Overview draft" />,
    },
    { key: 'x', label: 'Unavailable', disabled: true },
    { key: 'b', label: 'Settings', content: 'Settings content' },
    { key: 'c', label: 'History', content: 'History content' },
  ];
  return (
    <>
      <button
        on:click={() => {
          state.vertical = !state.vertical;
        }}
      >
        Toggle vertical tabs
      </button>
      <button
        on:click={() => {
          state.manual = !state.manual;
        }}
      >
        Toggle manual tabs
      </button>
      <button
        on:click={() => {
          state.destroy = !state.destroy;
        }}
      >
        Toggle destroy tabs
      </button>
      <button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Toggle disabled tabs
      </button>
      <button
        on:click={() => {
          state.width = 180;
        }}
      >
        Narrow tabs
      </button>
      <form
        on:submit={(event) => {
          event.preventDefault();
          events.push('submit');
        }}
      >
        <div style={`width:${state.width}px`}>
          <Tabs
            ariaLabel="Workspace"
            orientation={state.vertical ? 'vertical' : 'horizontal'}
            activation={state.manual ? 'manual' : 'automatic'}
            destroyOnHidden={state.destroy}
            disabled={state.disabled}
            options={options}
          />
        </div>
        <button>After tabs</button>
      </form>
    </>
  );
}
function SegmentedLab() {
  const state = vm({ value: 0 as number | undefined, reject: false, disabled: false });
  return (
    <form
      id="segmented-form"
      on:submit={(event) => {
        event.preventDefault();
      }}
    >
      <Segmented
        ariaLabel="Report range"
        name="range"
        value={state.value}
        block
        options={[
          { value: 0, label: 'Day' },
          { value: 1, label: 'Unavailable', disabled: true },
          { value: 7, label: 'Week' },
        ]}
        disabled={state.disabled}
        on:change={(value) => {
          events.push(value);
          if (!state.reject) state.value = value;
        }}
      />
      <Segmented
        ariaLabel="Uncontrolled range"
        name="initial"
        defaultValue={7}
        options={[
          { value: 0, label: 'Day' },
          { value: 7, label: 'Week' },
        ]}
      />
      <button
        type="button"
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject segmented requests
      </button>
      <button
        type="button"
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Disable segmented
      </button>
      <button type="reset">Reset segmented</button>
    </form>
  );
}
function StepsLab() {
  const state = vm({ current: 1, error: false, vertical: false });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push('submit');
      }}
    >
      <Steps
        ariaLabel="Publish workflow"
        current={state.current}
        status={state.error ? 'error' : 'process'}
        direction={state.vertical ? 'vertical' : 'horizontal'}
        on:change={(index) => {
          state.current = index;
          events.push(index);
        }}
        items={[
          { key: 'draft', title: 'Draft', description: 'Write content' },
          { key: 'review', title: 'Review', description: 'Check content' },
          { key: 'publish', title: 'Publish', disabled: true },
        ]}
      />
      <button
        type="button"
        on:click={() => {
          state.error = !state.error;
        }}
      >
        Toggle step error
      </button>
      <button
        type="button"
        on:click={() => {
          state.vertical = !state.vertical;
        }}
      >
        Toggle step direction
      </button>
    </form>
  );
}
function PaginationLab() {
  const state = vm({ current: 3, size: 10, reject: false, total: 250, disabled: false });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push('submit');
      }}
    >
      <Pagination
        ariaLabel="User pages"
        total={state.total}
        current={state.current}
        pageSize={state.size}
        showSizeChanger
        showQuickJumper
        showTotal
        disabled={state.disabled}
        on:change={(current, size) => {
          events.push([current, size]);
          if (!state.reject) {
            state.current = current;
            state.size = size;
          }
        }}
      />
      <button
        type="button"
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject pages
      </button>
      <button
        type="button"
        on:click={() => {
          state.total = 12;
        }}
      >
        Shrink total
      </button>
      <button
        type="button"
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Disable pages
      </button>
    </form>
  );
}
function tableSelectedText(keys: TableKey[]) {
  return keys.join(',');
}
type TableUser = { id: number; name: string; age: number; team: string; detail: string };
function TableLab() {
  const records = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
    age: 12 - index,
    team: index % 2 ? 'B' : 'A',
    detail: `Details for user ${index + 1}`,
  }));
  const state = vm({
    rows: records,
    selected: [] as TableKey[],
    expanded: [] as TableKey[],
    reject: false,
    loading: false,
  });
  const columns: ColumnType<TableUser>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name', width: 140, fixed: 'left' },
    {
      key: 'age',
      title: 'Age',
      dataIndex: 'age',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => a.age - b.age,
    },
    { key: 'detail', title: 'Details', dataIndex: 'detail', ellipsis: true },
    {
      key: 'team',
      title: 'Team',
      dataIndex: 'team',
      width: 120,
      fixed: 'right',
      filters: [
        { text: 'Team A', value: 'A' },
        { text: 'Team B', value: 'B' },
      ],
    },
  ];
  const selection = vm<TableRowSelection<TableUser>>({
    selectedRowKeys: [],
    getDisabled: (row) => row.id === 2,
    'on:change': (keys) => {
      events.push(keys);
      if (!state.reject) selection.selectedRowKeys = keys;
    },
  });
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        events.push('submit');
      }}
    >
      <button
        type="button"
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject table requests
      </button>
      <button
        type="button"
        on:click={() => {
          state.loading = !state.loading;
        }}
      >
        Toggle table loading
      </button>
      <button
        type="button"
        on:click={() => {
          state.rows = state.rows.length ? [] : records;
        }}
      >
        Toggle table data
      </button>
      <div style="width:580px;max-width:100%">
        <Table
          ariaLabel="User records"
          caption="Account list"
          rowKey="id"
          columns={columns}
          data={state.rows}
          size="sm"
          bordered
          loading={state.loading}
          scroll={{ x: 1000, y: 240 }}
          pagination={{ defaultPageSize: 5, showSizeChanger: true, pageSizeOptions: [5, 10, 20] }}
          rowSelection={selection}
          expandedRowKeys={state.expanded}
          on:expandedRowsChange={(keys) => {
            if (!state.reject) state.expanded = keys;
          }}
          slot:expandedRowRender={(slot) => (
            <label>
              Details:{slot.data.name}
              <input aria-label={`Note for ${slot.data.name}`} />
            </label>
          )}
          on:change={(change) => {
            events.push(change.action);
          }}
        />
      </div>
      <output id="table-selected">{tableSelectedText(selection.selectedRowKeys ?? [])}</output>
    </form>
  );
}
function TableFixedLab() {
  const state = vm({ loading: false });
  return (
    <div style="width:420px">
      <button
        on:click={() => {
          state.loading = !state.loading;
        }}
      >
        Toggle fixed loading
      </button>
      <Table
        loading={state.loading}
        rowKey="id"
        data={[{ id: 1, name: 'Ada', age: 30 }]}
        scroll={{ x: 800 }}
        columns={[
          {
            key: 'name',
            title: 'VeryLongUnbreakableColumnName',
            dataIndex: 'name',
            width: 80,
            fixed: 'left',
          },
          { key: 'age', title: 'Age', dataIndex: 'age', width: 80, fixed: 'left' },
          { key: 'detail', title: 'Description', dataIndex: 'name' },
        ]}
      />
    </div>
  );
}
function plainDateText(date: Temporal.PlainDate | null) {
  return date?.toString() ?? 'empty';
}
function plainTimeText(time: Temporal.PlainTime | null) {
  return time?.toString({ smallestUnit: 'second' }) ?? 'empty';
}
function rangeText(range: DateRange | null) {
  return range ? `${range[0].toString()}/${range[1].toString()}` : 'empty';
}
function pickerDisabledDate(date: Temporal.PlainDate) {
  return date.year === 2024 && date.month === 2 && date.day === 29;
}
function PickerLab() {
  const state = vm({
    date: Temporal.PlainDate.from('2024-02-28') as Temporal.PlainDate | null,
    range: null as DateRange | null,
    time: Temporal.PlainTime.from('10:00') as Temporal.PlainTime | null,
    reject: false,
    disabled: false,
    readOnly: false,
  });
  const minimum = Temporal.PlainDate.from('2024-02-01'),
    maximum = Temporal.PlainDate.from('2024-04-30'),
    rangeMonth = Temporal.PlainDate.from('2026-11-01'),
    initial = Temporal.PlainDate.from('2026-11-03');
  return (
    <form
      id="picker-form"
      on:submit={(event) => {
        event.preventDefault();
        events.push('submit');
      }}
    >
      <DatePicker
        ariaLabel="Lab date"
        value={state.date}
        name="date"
        minDate={minimum}
        maxDate={maximum}
        disabledDate={pickerDisabledDate}
        allowClear
        required
        disabled={state.disabled}
        readOnly={state.readOnly}
        on:change={(value) => {
          events.push(plainDateText(value));
          if (!state.reject) state.date = value;
        }}
      />
      <RangePicker
        ariaLabel="Lab range"
        value={state.range}
        defaultPickerValue={rangeMonth}
        name="range"
        allowClear
        on:change={(value) => {
          events.push(rangeText(value));
          if (!state.reject) state.range = value;
        }}
      />
      <TimePicker
        ariaLabel="Lab time"
        value={state.time}
        name="time"
        minuteStep={15}
        disabledHours={() => [11]}
        allowClear
        on:change={(value) => {
          events.push(plainTimeText(value));
          if (!state.reject) state.time = value;
        }}
      />
      <DatePicker ariaLabel="Reset date" defaultValue={initial} name="resetDate" />
      <button
        type="button"
        on:click={() => {
          state.reject = !state.reject;
        }}
      >
        Reject picker requests
      </button>
      <button
        type="button"
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        Disable date picker
      </button>
      <button
        type="button"
        on:click={() => {
          state.readOnly = !state.readOnly;
        }}
      >
        Readonly date picker
      </button>
      <button type="reset">Reset pickers</button>
      <button type="submit">Submit pickers</button>
      <button type="button">After pickers</button>
      <output id="picker-date">{plainDateText(state.date)}</output>
      <output id="picker-range">{rangeText(state.range)}</output>
      <output id="picker-time">{plainTimeText(state.time)}</output>
    </form>
  );
}
function PickerModalLab() {
  const state = vm({ open: false });
  const initial = Temporal.PlainDate.from('2026-11-03');
  return (
    <>
      <button
        on:click={() => {
          state.open = true;
        }}
      >
        Open date modal
      </button>
      <Modal
        open={state.open}
        title="Date dialog"
        on:cancel={() => {
          state.open = false;
        }}
      >
        <DatePicker ariaLabel="Modal date" defaultValue={initial} />
      </Modal>
    </>
  );
}
function PickerUnsupportedLab() {
  return <DatePicker ariaLabel="Unsupported date" />;
}

function UploadLab() {
  const data = vm({
    files: [] as UploadFile[],
    rejects: '',
    changes: 0,
    submitted: 0,
    disabled: false,
    acceptChanges: true,
    show: true,
    raw: '',
    lastType: '',
    aborted: 0,
  });
  const attempts = new Map<string, number>();
  function request(options: UploadRequestOptions): Promise<unknown> {
    const attempt = (attempts.get(options.file.name) ?? 0) + 1;
    attempts.set(options.file.name, attempt);
    data.raw = `${options.file.name}:${options.file.slice(0, 1).size}`;
    return new Promise((resolve, reject) => {
      let percent = 0;
      const timer = window.setInterval(() => {
        percent += 20;
        options.onProgress(percent);
        if (percent < 100) return;
        window.clearInterval(timer);
        options.signal.removeEventListener('abort', abort);
        if (options.file.name.startsWith('fail') && attempt === 1)
          reject(new Error('模拟网络失败'));
        else resolve({ id: options.file.name });
      }, 100);
      function abort() {
        data.aborted++;
        window.clearInterval(timer);
        reject(new Error('aborted'));
      }
      options.signal.addEventListener('abort', abort, { once: true });
    });
  }
  function change(files: UploadFile[], info: { type: string }) {
    data.changes++;
    data.lastType = info.type;
    if (data.acceptChanges) data.files = files;
  }
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        data.submitted++;
      }}
    >
      {data.show && (
        <Upload
          fileList={data.files}
          multiple
          drag
          accept=".txt"
          maxSize={12}
          maxCount={3}
          concurrency={1}
          disabled={data.disabled}
          ariaLabel="上传附件"
          customRequest={request}
          on:change={change}
          on:reject={(file, reason) => {
            data.rejects = `${file.name}:${reason}`;
          }}
        >
          点击或拖入文本文件
        </Upload>
      )}
      <Upload
        ariaLabel="手动附件"
        autoUpload={false}
        action="/upload-test"
        name="attachment"
        headers={{ 'X-Upload-Test': 'yes' }}
        data={{ category: 'report', metadata: new Blob(['meta'], { type: 'text/plain' }) }}
      />
      <button
        type="button"
        on:click={() => {
          data.disabled = !data.disabled;
        }}
      >
        切换上传禁用
      </button>
      <button
        type="button"
        on:click={() => {
          data.acceptChanges = !data.acceptChanges;
        }}
      >
        切换列表接收
      </button>
      <button
        type="button"
        on:click={() => {
          data.files = [];
        }}
      >
        外部移除文件
      </button>
      <button
        type="button"
        on:click={() => {
          data.show = !data.show;
        }}
      >
        挂载上传组件
      </button>
      <button type="reset">重置上传表单</button>
      <output id="upload-aborted">{data.aborted}</output>
      <output id="upload-count">{data.changes}</output>
      <output id="upload-submit">{data.submitted}</output>
      <output id="upload-reject">{data.rejects}</output>
      <output id="upload-raw">{data.raw}</output>
      <output id="upload-event">{data.lastType}</output>
      <button type="button">上传之后</button>
    </form>
  );
}

function treeLabData(): TreeNode[] {
  return [
    {
      key: 'root',
      label: '团队',
      children: [
        { key: 0, label: '开发' },
        { key: 'ops', label: '运维' },
        {
          key: 'off',
          label: '停用团队',
          disabled: true,
          children: [{ key: 'off-child', label: '停用成员' }],
        },
      ],
    },
    { key: 'lazy', label: '远程团队', isLeaf: false },
  ];
}
function TreeLab() {
  const data = vm({
    nodes: treeLabData(),
    expanded: [] as (string | number)[],
    selected: [] as (string | number)[],
    checked: [] as (string | number)[],
    filter: '',
    accept: true,
    disabled: false,
    submitted: 0,
    aborted: 0,
  });
  let attempts = 0;
  function load(_node: TreeNode, { signal }: { signal: AbortSignal }): Promise<TreeNode[]> {
    const attempt = ++attempts;
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        signal.removeEventListener('abort', abort);
        if (attempt === 1) reject(new Error('加载失败'));
        else resolve([{ key: 'remote-child', label: '远程成员' }]);
      }, 180);
      function abort() {
        data.aborted++;
        window.clearTimeout(timer);
        reject(new Error('aborted'));
      }
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        data.submitted++;
      }}
    >
      <button type="button">树之前</button>
      <Tree
        treeData={data.nodes}
        expandedKeys={data.expanded}
        selectedKeys={data.selected}
        checkedKeys={data.checked}
        checkable
        multiple
        disabled={data.disabled}
        filter={data.filter}
        ariaLabel="团队树"
        loadData={load}
        on:expand={(keys) => {
          if (data.accept) data.expanded = keys;
        }}
        on:select={(keys) => {
          if (data.accept) data.selected = keys;
        }}
        on:check={(keys) => {
          if (data.accept) data.checked = keys;
        }}
        slot:title={(slot) => (
          <span>
            {slot.node.label}
            <small> · 团队</small>
          </span>
        )}
      />
      <button type="button">树之后</button>
      <label>
        筛选团队
        <input
          aria-label="筛选团队"
          value={data.filter}
          on:input={(event) => {
            data.filter = (event.currentTarget as HTMLInputElement).value;
          }}
        />
      </label>
      <button
        type="button"
        on:click={() => {
          data.accept = !data.accept;
        }}
      >
        切换树接收
      </button>
      <button
        type="button"
        on:click={() => {
          data.disabled = !data.disabled;
        }}
      >
        切换树禁用
      </button>
      <button
        type="button"
        on:click={() => {
          data.nodes = [
            {
              key: 'root',
              label: '团队',
              children: [
                { key: 'ops', label: '运维' },
                { key: 0, label: '开发' },
              ],
            },
            { key: 'lazy', label: '远程团队', isLeaf: false },
          ];
        }}
      >
        重排团队
      </button>
      <button
        type="button"
        on:click={() => {
          data.expanded = [];
        }}
      >
        外部收起团队
      </button>
      <output id="tree-selected">{JSON.stringify(data.selected)}</output>
      <output id="tree-checked">{JSON.stringify(data.checked)}</output>
      <output id="tree-submit">{data.submitted}</output>
    </form>
  );
}
function cascaderLabData(): CascaderOption[] {
  return [
    {
      value: 'zj',
      label: '浙江',
      children: [
        {
          value: 'hz',
          label: '杭州',
          children: [
            { value: 0, label: '西湖' },
            { value: 'yh', label: '余杭', disabled: true },
          ],
        },
        { value: 'nb', label: '宁波', disabled: true },
      ],
    },
    { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
    { value: 'remote', label: '远程', isLeaf: false },
  ];
}
function CascaderLab() {
  const data = vm({
    options: cascaderLabData(),
    value: null as CascaderValue | null,
    disabled: false,
    readOnly: false,
    accept: true,
    intermediate: false,
    submitted: 0,
    aborted: 0,
  });
  let attempts = 0;
  function load(
    _node: CascaderOption,
    { signal }: { signal: AbortSignal },
  ): Promise<CascaderOption[]> {
    const attempt = ++attempts;
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        signal.removeEventListener('abort', abort);
        if (attempt === 1) reject(new Error('地区加载失败'));
        else resolve([{ value: 'remote-leaf', label: '远程子项' }]);
      }, 180);
      function abort() {
        data.aborted++;
        window.clearTimeout(timer);
        reject(new Error('aborted'));
      }
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  return (
    <form
      on:submit={(event) => {
        event.preventDefault();
        data.submitted++;
      }}
      on:reset={() => {
        data.value = null;
      }}
    >
      <label htmlFor="region">地区</label>
      <Cascader
        id="region"
        options={data.options}
        value={data.value}
        showSearch
        required
        allowClear
        name="location"
        disabled={data.disabled}
        readOnly={data.readOnly}
        changeOnSelect={data.intermediate}
        loadData={load}
        on:change={(value) => {
          if (data.accept) data.value = value;
        }}
      />
      <button type="button">级联之后</button>
      <button type="submit">提交地区</button>
      <button type="reset">重置地区</button>
      <button
        type="button"
        on:click={() => {
          data.accept = !data.accept;
        }}
      >
        切换级联接收
      </button>
      <button
        type="button"
        on:click={() => {
          data.disabled = !data.disabled;
        }}
      >
        切换级联禁用
      </button>
      <button
        type="button"
        on:click={() => {
          data.readOnly = !data.readOnly;
        }}
      >
        切换级联只读
      </button>
      <button
        type="button"
        on:click={() => {
          data.intermediate = !data.intermediate;
        }}
      >
        切换中间级选择
      </button>
      <output id="cascader-value">{JSON.stringify(data.value)}</output>
      <output id="cascader-submit">{data.submitted}</output>
    </form>
  );
}
function CascaderModalLab() {
  const data = vm({ open: false });
  return (
    <>
      <Button
        on:click={() => {
          data.open = true;
        }}
      >
        打开地区弹窗
      </Button>
      <Modal
        open={data.open}
        title="选择地区"
        on:cancel={() => {
          data.open = false;
        }}
      >
        <Cascader options={cascaderLabData()} ariaLabel="弹窗地区" />
      </Modal>
    </>
  );
}

const cases: Record<string, FC> = {
  treelab: TreeLab,
  cascaderlab: CascaderLab,
  cascaderdialog: CascaderModalLab,
  upload: UploadLab,
  breadcrumb: BreadcrumbLab,
  dropdown: DropdownLab,
  dropdowndialog: DropdownDialogLab,
  menu: MenuLab,
  form: FormLab,
  formrace: FormRaceLab,
  formdynamic: FormDynamicLab,
  selectlong: SelectLongLab,
  autocomplete: AutoCompleteLab,
  select: SelectLab,
  selectdialog: SelectDialogLab,
  switch: SwitchLab,
  radio: RadioLab,
  checkbox: CheckboxLab,
  number: NumberLab,
  password: PasswordLab,
  textarea: TextAreaLab,
  input: InputLab,
  result: ResultLab,
  progress: ProgressLab,
  skeleton: SkeletonLab,
  spin: SpinLab,
  alert: AlertLab,
  card: CardLab,
  collapse: CollapseLab,
  descriptions: DescriptionsLab,
  empty: EmptyLab,
  buttons: Buttons,
  floating: FloatingLab,
  scroll: ScrollFloating,
  nested: NestedPortals,
  overlaylab: OverlayLab,
  layers: Layers,
  polygon: HoverPolygon,
  tabs: TabLayout,
  pagination: PaginationLab,
  tabslab: TabsLab,
  segmented: SegmentedLab,
  steps: StepsLab,
  forms: Forms,
  selection: Selection,
  overlays: Overlays,
  dialog: Dialog,
  dialoglab: DialogLab,
  notices: NoticeLab,
  display: DisplayLab,
  table: Rows,
  pickers: PickerLab,
  pickermodal: PickerModalLab,
  pickerunsupported: PickerUnsupportedLab,
  tablelab: TableLab,
  tablefixed: TableFixedLab,
};
const name = new URLSearchParams(location.search).get('case') ?? 'forms';
if (!cases[name]) throw new Error(`Unknown test case: ${name}`);
bootstrap(cases[name], document.getElementById('app')!);
