import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OptionModel } from '../models/keyword.model';

@Component({
  selector: 'nx-resume-project-filter',
  templateUrl: './project-filter.component.html',
  styleUrls: ['./project-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFilterComponent {
  @Input() keywordOptions: OptionModel[] = [];
  @Output() keywordClicked: EventEmitter<OptionModel> = new EventEmitter<OptionModel>();

  toggleKeyword(keyword: OptionModel) {
    this.keywordClicked.emit(keyword);
  }
}
