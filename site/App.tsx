import { vm } from 'jinge';

export function App(props) {
  const state = vm({
    k: 'c',
    n: 10,
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
      {props?.children?.({ a })}
      hello
    </div>
  );
}
