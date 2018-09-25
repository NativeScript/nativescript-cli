import { NgModule } from '@angular/core';
import { init } from './sdk';

@NgModule({
  imports: [],
  declarations: [],
  exports: []
})
export class KinveyModule {
  static init(config) {
    return init(config);
  }
}
