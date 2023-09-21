import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from './states/app-store';



@NgModule({
  declarations: [],
  providers: [AppStore],
  imports: [
    CommonModule
  ]
})
export class StateModule { }
