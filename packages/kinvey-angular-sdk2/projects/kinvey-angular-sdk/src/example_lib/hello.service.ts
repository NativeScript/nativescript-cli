import { Injectable } from '@angular/core';
import { hello } from './hello';

@Injectable()
export class HelloService {
  hello() {
    return hello();
  }
}
