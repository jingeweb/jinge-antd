import { Row, Col } from 'jinge-antd';

export function GridExample() {
  return (
    <div className="demo-stack">
      <Row gutter={[12, 16]}>
        <Col xs={24} md={12}>
          <div className="grid-cell">xs: 24 / md: 12</div>
        </Col>
        <Col xs={24} md={12}>
          <div className="grid-cell">xs: 24 / md: 12</div>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <div className="grid-cell">8</div>
        </Col>
        <Col span={8} offset={8}>
          <div className="grid-cell">8 + offset 8</div>
        </Col>
      </Row>
    </div>
  );
}
