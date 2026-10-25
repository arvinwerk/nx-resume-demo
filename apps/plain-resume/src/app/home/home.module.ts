import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home.component';
import {ProjectsModule} from '@nx-resume/projects';
import {StateModule} from '@nx-resume/state';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioChatComponent } from '../portfolio/portfolio-chat.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [HomeComponent, PortfolioChatComponent],
  imports: [
    CommonModule,
    ProjectsModule,
    StateModule,
    RouterModule.forChild(routes)
  ]
})
export class HomeModule { }
