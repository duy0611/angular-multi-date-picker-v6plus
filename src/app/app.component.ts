import { Component, ViewChild } from '@angular/core';

import * as moment from 'moment/moment';
import { MultiDatePickerComponent } from './multi-date-picker.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    @ViewChild(MultiDatePickerComponent) mutliDatePickerComponent;
    selectedDays: Array<any> = [];

    title = 'angular-multidatepicker-v6plus';

    constructor() {
        const datesNotAvailable = '2018-12-20, 2019-01-10, 2019-01-17, 2019-02-14';
        if (datesNotAvailable && datesNotAvailable.length > 0) {
            datesNotAvailable.split(',').forEach(dStr => {
                this.selectedDays.push(moment(dStr.trim(), 'YYYY-MM-DD'));
            });
        }
    }

    onSelectedDaysChange(event) {
        // console.log(event);
        this.selectedDays = event;
    }

    getSelectedDaysAsText() {
        return this.selectedDays.map(d => {
            return d.format('YYYY-MM-DD');
        }).sort().join(', ');
    }

}
