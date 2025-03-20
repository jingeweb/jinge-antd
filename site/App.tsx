// import { modal } from '../src/modal';
import { Tooltip } from '@/tooltip';
import { vm, watch } from 'jinge';

function A(props: { k: () => void }) {
  return <button on:click={props.k}>AAA</button>;
}
export function App() {
  const state = vm({
    n: 10,
    k: () => {
      console.log('a');
    },
  });
  // setInterval(() => {
  //   state.n++;
  // }, 1000);

  // async function showM() {
  //   const modalInstance = modal.show({
  //     title: 'TEST',
  //     'slot:content': (
  //       <>
  //         <p>Hello, World {state.n}</p>
  //         <div>

  //           <button on:click={state.t}>OPEN</button>
  //         </div>
  //       </>
  //     ),
  //     // content: 'hhh',
  //     'on:afterClose': () => {
  //       console.info('after close');
  //     },
  //   });
  //   await modalInstance.waitForClose();
  //   console.info('after close 2');
  // }

  // watch(state, 'k', (v) => {
  //   console.log(v);
  // })

  return (
    <div className='pt-10'>
      {state.n}
      {state.n + state.n}
      <Tooltip open content='this is a tooltip'>
        <A k={state.k} />
      </Tooltip>
      <p>
        <button
          on:click={() => {
            state.k = () => {
              console.log('b');
            };
          }}
        >
          TEST
        </button>
      </p>
      <div className='p-36'></div>
    </div>
  );
}
