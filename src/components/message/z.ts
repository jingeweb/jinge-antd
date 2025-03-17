import { vm } from 'jinge';

export const z = vm({
  currentIndex: 10,
  increment,
  decrement,
});

function increment() {
  z.currentIndex += 10;
}

function decrement() {
  z.currentIndex -= 10;
}
