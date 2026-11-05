import { t } from 'jinge';

import type { ComponentDoc } from '../data/types';

import { DemoCard } from './DemoCard';

function importExample(doc: ComponentDoc) {
  return `import { ${(doc.imports ?? [doc.name]).join(', ')} } from 'jinge-antd';`;
}

export function ComponentPage(props: { doc: ComponentDoc }) {
  return (
    <article className="component-page">
      <div className="page-category">
        {props.doc.category} / {props.doc.name}
      </div>
      <h1>
        {props.doc.name} {props.doc.title !== props.doc.name && <span>{props.doc.title}</span>}
      </h1>
      <p className="page-description">{props.doc.description}</p>
      {props.doc.status === 'ready' ? (
        <>
          <div className="import-line">
            <code>{importExample(props.doc)}</code>
          </div>
          <h2 id="examples">{t('代码演示')}</h2>
          <div className="demos">
            {props.doc.demos.map((demo) => (
              <DemoCard key={demo.id} demo={demo} />
            ))}
          </div>
          <h2 id="api">API</h2>
          <p className="section-hint">
            {t(
              '使用 on: 绑定事件、slot: 传递命名插槽。以下类型对应当前实现。默认文案保留组件当前原文，组件本身暂未国际化。',
            )}
          </p>
          <div className="api-scroll">
            <table className="api-table">
              <thead>
                <tr>
                  <th>{t('属性 / 事件 / 插槽')}</th>
                  <th>{t('类型')}</th>
                  <th>{t('默认值')}</th>
                  <th>{t('说明')}</th>
                </tr>
              </thead>
              <tbody>
                {props.doc.api.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <code>{row.name}</code>
                    </td>
                    <td>
                      <code>{row.type}</code>
                    </td>
                    <td>{row.default ?? '—'}</td>
                    <td>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 id="notes">{t('说明与限制')}</h2>
          <ul className="notes">
            {props.doc.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : (
        <section className="planned-panel">
          <span className="planned-symbol" aria-hidden="true">
            ◇
          </span>
          <h2>{t('已列入实施范围')}</h2>
          <p>
            {t('本组件尚未按新的能力清单完成交付。实现、验证和示例完成后，会在此提供可运行文档。')}
          </p>
          <p className="section-hint">{t('当前页面用于说明范围，不代表组件能力已经实现。')}</p>
        </section>
      )}
    </article>
  );
}
