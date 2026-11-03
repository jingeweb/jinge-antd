import { Title, Paragraph, Text, Link, Space } from 'jinge-antd';

export function TypographyExample() {
  return (
    <div>
      <Title level={3}>记录详情</Title>
      <Paragraph>使用明确的标题与段落组织业务信息。</Paragraph>
      <Space size="md" wrap>
        <Text strong>重点内容</Text>
        <Text tone="secondary">次要说明</Text>
        <Text tone="success">操作成功</Text>
        <Text tone="warning">等待确认</Text>
        <Text tone="danger">发生错误</Text>
        <Text code>record.id</Text>
        <Text mark>标记</Text>
      </Space>
      <Paragraph>
        <Link href="https://ant.design/components/typography/" target="_blank">
          参考 Typography
        </Link>
      </Paragraph>
      <Text ellipsis style="width:220px">
        这是一段超过容器宽度后会自动省略的较长说明文字。
      </Text>
    </div>
  );
}
