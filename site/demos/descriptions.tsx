import { vm } from 'jinge';
import { Button, Descriptions, type DescriptionItem, Space, Tag } from 'jinge-antd';

export function DescriptionsExample() {
  const state = vm({ vertical: false, bordered: true });
  const items = vm<DescriptionItem[]>([
    { key: 'name', label: '姓名', content: '张三' },
    { key: 'status', label: '状态', 'slot:content': <Tag color="success">已签约</Tag> },
    { key: 'quota', label: '剩余额度', content: 0 },
    { key: 'company', label: '公司', content: '示例科技有限公司', span: 2 },
    { key: 'note', label: '备注', content: null },
    {
      key: 'address',
      label: '联系地址',
      content: '上海市徐汇区示例路 100 号，完整行可用 filled 跨越全部列。',
      span: 'filled',
    },
  ]);
  return (
    <Space direction="vertical" style="width:100%">
      <Space wrap>
        <Button
          on:click={() => {
            state.vertical = !state.vertical;
          }}
        >
          切换详情方向
        </Button>
        <Button
          on:click={() => {
            state.bordered = !state.bordered;
          }}
        >
          切换详情边框
        </Button>
      </Space>
      <Descriptions
        title="客户详情"
        items={items}
        bordered={state.bordered}
        layout={state.vertical ? 'vertical' : 'horizontal'}
        column={{ xs: 1, sm: 2, lg: 3 }}
        slot:extra={
          <Button
            size="sm"
            on:click={() => {
              items[2].content = Number(items[2].content) + 1;
            }}
          >
            增加额度
          </Button>
        }
      />
    </Space>
  );
}
