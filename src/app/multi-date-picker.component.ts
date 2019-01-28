import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import * as moment from 'moment/moment';

export const DEFAULT_TEMPLATE = `
<div class="multiple-date-picker">
    <div class="picker-top-row">
        <div class="text-center picker-navigate picker-navigate-left-arrow" id="button" [ngClass]="{'disabled':disableBackButton}" (click)="changeMonth($event, disableBackButton, -1)">
            <p><i class="fa fa-angle-left" aria-hidden="true"></i></p>
        </div>
        <div class="text-center text-muted picker-month">
            {{monthToDisplay}}
            <span *ngIf="yearsForSelect.length < 2">{{yearToDisplay}}</span>
        </div>
        <div class="text-center picker-navigate picker-navigate-right-arrow" [ngClass]="{'disabled':disableNextButton}" (click)="changeMonth($event, disableNextButton, 1)">
            <p><i class="fa fa-angle-right" aria-hidden="true"></i></p>
        </div>
            
    </div>
    <div class="picker-days-week-row">
        <div class="text-center" *ngFor="let weekDays of daysOfWeek">{{weekDays}}</div>
    </div>
    <div class="picker-days-row">
        <div dateClicked class="text-center picker-day {{getDayClasses(day)}}" title="{{day.title}}" *ngFor="let day of days" (click)="toggleDay($event, day)" >
            {{day ? day.mdp.otherMonth && !showDaysOfSurroundingMonths ? '&nbsp;' : day.date.format('D') : ''}}
        </div>
    </div>
</div>
`;

@Component({
    selector: 'app-multi-date-picker',
    template: DEFAULT_TEMPLATE,
    styleUrls: ['./multi-date-picker.component.css']
})
export class MultiDatePickerComponent implements OnInit {

    @Input() highlightDays: Array<any>;
    @Input() dayClick: any;
    @Input() dayHover: string;
    @Input() monthChanged: any;
    @Input() monthClick: any;
    @Input() weekDaysOff: Array<number>;
    @Input() allDaysOff: string;
    @Input() daysAllowed: any;
    @Input() disableNavigation: boolean;
    @Input() disallowBackPastMonths: boolean;
    @Input() disallowGoFuturMonths: string;
    @Input() showDaysOfSurroundingMonths: boolean;
    @Input() cssDaysOfSurroundingMonths: any = this.cssDaysOfSurroundingMonths || 'picker-empty';
    @Input() fireEventsForDaysOfSurroundingMonths: string;
    @Input() disableDaysBefore: any;
    @Input() disableDaysAfter: any;
    @Input() changeYearPast: string;
    @Input() changeYearFuture: string;
    @Input() sundayFirstDay: boolean;

    @Input() month = moment().startOf('day');  // today's day at start of day midnight or passed in value

    // manipulate list of selected dates
    @Input() selectedDays: Array<any> = [];
    @Output() selectedDaysChange: EventEmitter<Array<any>> = new EventEmitter<Array<any>>();

    days: Array<any> = [];
    daysOff: any = this.daysOff || [];
    disableBackButton: any = false;
    disableNextButton: any = false;
    daysOfWeek: Array<any> = [];
    yearsForSelect: any = [];
    monthToDisplay: string;
    yearToDisplay: string;

    constructor() { }

    ngOnInit() {
        if (this.month === undefined) {
            this.month = moment().startOf('day');
        }

        this.generate();
        this.daysOfWeek = this.getDaysOfWeek();
        this.weekDaysOff = this.weekDaysOff || [];
    }

    /* Generate the calendar */
    generate() {
        this.yearsForSelect = this.getYearsForSelect();
        this.monthToDisplay = this.getMonthYearToDisplay();
        this.yearToDisplay = this.month.format('YYYY');

        let previousDay = moment(this.month).date(0).day(this.sundayFirstDay ? 0 : 1).subtract(1, 'day');

        if (moment(this.month).date(0).diff(previousDay, 'day') > 6) {
            previousDay = previousDay.add(1, 'week');
        }

        const firstDayOfMonth = moment(this.month).date(1),
            days = [],
            now = moment(),
            lastDay = moment(firstDayOfMonth).endOf('month'),
            createDate = () => {
                const day = {
                    selectable: true,
                    date: moment(previousDay.add(1, 'day')),
                    css: null,
                    title: '',
                    mdp: {
                        selected: false,
                        today: false,
                        past: true,
                        future: true,
                        otherMonth: false
                    },
                };
                if ((Object.prototype.toString.call(this.highlightDays) === '[object Array]')) {
                    const hlDay = this.highlightDays.filter(function (d) {
                        return day.date.isSame(d.date, 'day');
                    });
                    day.css = hlDay.length > 0 ? hlDay[0].css : '';
                    day.title = hlDay.length > 0 ? hlDay[0].title : '';
                }
                day.selectable = !this.isDayOff(day);
                day.mdp.selected = this.isSelected(day);
                day.mdp.today = day.date.isSame(now, 'day');
                day.mdp.past = day.date.isBefore(now, 'day');
                day.mdp.future = day.date.isAfter(now, 'day');
                if (!day.date.isSame(this.month, 'month')) {
                    day.mdp.otherMonth = true;
                }
                return day;
            };

        const lastDayOfWeek = this.sundayFirstDay ? 6 : 0;
        let maxDays = lastDay.diff(previousDay, 'days');
        if (lastDay.day() !== lastDayOfWeek) {
            maxDays += (this.sundayFirstDay ? 6 : 7) - lastDay.day();
        }

        for (let j = 0; j < maxDays; j++) {
            days.push(createDate());
        }

        this.days = days;

        this.checkNavigationButtons();
        this.refreshCssSelectedDates(this.selectedDays);
    }

    toggleDay(event, day) {
        event.preventDefault();
        if (day.mdp.otherMonth && !this.fireEventsForDaysOfSurroundingMonths) {
            return;
        }

        let prevented = false;
        event.preventDefault = () => {
            prevented = true;
        };

        if (typeof this.dayClick === 'function') {
            if (!day.mdp.selected) {
                this.selectedDays = [day.date];
                this.generate();
                this.dayClick(event, day);
            } else {
                this.clearDays();
                this.dayClick(event, day);
            }
        }

        if (day.selectable && !prevented) {
            day.mdp.selected = !day.mdp.selected;
            if (day.mdp.selected) {
                this.selectedDays.push(day.date);
            } else {
                let idx = -1;
                for (let i = 0; i < this.selectedDays.length; ++i) {
                    if (moment.isMoment(this.selectedDays[i])) {
                        if (this.selectedDays[i].isSame(day.date, 'day')) {
                            idx = i;
                            break;
                        }
                    } else {
                        if (this.selectedDays[i].date.isSame(day.date, 'day')) {
                            idx = i;
                            break;
                        }
                    }
                }
                if (idx !== -1) {
                    this.selectedDays.splice(idx, 1);
                } 
            }
        }

        // finally, update css of selected days in current view
        this.refreshCssSelectedDates(this.selectedDays);
        this.selectedDaysChange.emit(this.selectedDays);
    }

    clearDays() {
        this.selectedDays = [];
        this.generate();
    }

    getDayClasses(day) {
        let css = '';
        if (day.css && (!day.mdp.otherMonth || this.showDaysOfSurroundingMonths)) {
            css += ' ' + day.css;
        }
        if (this.cssDaysOfSurroundingMonths && day.mdp.otherMonth) {
            css += ' ' + this.cssDaysOfSurroundingMonths;
        }
        if (day.mdp.selected) {
            css += ' picker-selected';
        }
        if (!day.selectable) {
            css += ' picker-off';
        }
        if (day.mdp.today) {
            if (this.highlightDays !== undefined && this.highlightDays.length > 0) {
                const arrayObject = this.highlightDays.find(x => x.css);
                const arrayKeys = Object.keys(this.highlightDays);
                if (arrayObject !== undefined && arrayKeys.length > 0) {
                    const highlightDayCss = arrayObject.css;
                    css += ' today ' + highlightDayCss;
                } else {
                    css += ' today ';
                }
            }
        }
        if (day.mdp.past) {
            css += ' past';
        }
        if (day.mdp.future) {
            css += ' future';
        }
        if (day.mdp.otherMonth) {
            css += ' picker-other-month';
        }
        return css;
    }
    
    /* Navigate to another month */
    changeMonth(event, disable, add) {
        if (disable) {
            return;
        }
        event.preventDefault();
        let prevented = false;
        event.preventDefault = () => {
            // console.log('entered into preventDefault *****'); // for testing
            prevented = true;
        };
        const monthTo = moment(this.month).add(add, 'month');
        if (typeof this.monthClick === 'function') {
            this.monthClick(event, monthTo);
        }
        if (!prevented) {
            const oldMonth = moment(this.month);
            this.month = monthTo;
            if (typeof this.monthChanged === 'function') {
                this.monthChanged(this.month, oldMonth);
            }
            this.generate();
        }
    }

    /* Change year */
    changeYear(year) {
        this.month = this.month.year(parseInt(year, 10));
    }

    private checkNavigationButtons() {
        const today = moment(), previousMonth = moment(this.month).subtract(1, 'month'), nextMonth = moment(this.month).add(1, 'month');
        this.disableBackButton = this.disableNavigation || (this.disallowBackPastMonths && today.isAfter(previousMonth, 'month'));
        this.disableNextButton = this.disableNavigation || (this.disallowGoFuturMonths && today.isBefore(nextMonth, 'month'));
    }

    private getDaysOfWeek() {
        /*To display days of week names in moment.lang*/
        const momentDaysOfWeek = moment().localeData().weekdaysMin(), daysOfWeek = [];
        for (let i = 1; i < 7; i++) {
            daysOfWeek.push(momentDaysOfWeek[i]);
        }
        if (this.sundayFirstDay) {
            daysOfWeek.splice(0, 0, momentDaysOfWeek[0]);
        } else {
            daysOfWeek.push(momentDaysOfWeek[0]);
        }
        return daysOfWeek;
    }

    private getMonthYearToDisplay() {
        const month = this.month.format('MMMM');
        return month.charAt(0).toUpperCase() + month.slice(1);
    }

    private getYearsForSelect() {
        const now = moment(),
            changeYearPast = Math.max(0, parseInt(this.changeYearPast, 10) || 0),
            changeYearFuture = Math.max(0, parseInt(this.changeYearFuture, 10) || 0),
            min = moment(this.month).subtract(changeYearPast, 'year'),
            max = moment(this.month).add(changeYearFuture, 'year'),
            result = [];
        max.add(1, 'year');
        for (const m = moment(min); max.isAfter(m, 'year'); m.add(1, 'year')) {
            if ((!this.disallowBackPastMonths || (m.isAfter(now, 'year') || m.isSame(now, 'year'))) && (!this.disallowGoFuturMonths || (m.isBefore(now, 'year') || m.isSame(now, 'year')))) {
                result.push(m.format('YYYY'));
            }
        }
        return result;
    }

    /* Check if the date is off : unselectable */
    private isDayOff(day) {
        return this.allDaysOff ||
            (this.disableDaysBefore && moment(day.date).isBefore(moment(), 'day')) ||
            (!!this.disableDaysAfter && moment(day.date).isAfter(moment(), 'day')) ||
            ((this.weekDaysOff instanceof Array) && this.weekDaysOff.some(function (dayOff) {
                return day.date.day() === dayOff;
            })) ||
            ((this.daysOff === Array) && this.daysOff.some(function (dayOff) {
                return day.date.isSame(dayOff, 'day');
            })) ||
            ((this.daysAllowed === Array) && !this.daysAllowed.some(function (dayAllowed) {
                return day.date.isSame(dayAllowed, 'day');
            })) ||
            ((Object.prototype.toString.call(this.highlightDays) === '[object Array]') && this.highlightDays.some(function (highlightDay) {
                return day.date.isSame(highlightDay.date, 'day') && !highlightDay.selectable && highlightDay.css;
            }));
    }

    /* Check if the date is selected */
    private isSelected(day) {
        return this.selectedDays.some(function (d) {
            return day.date.isSame(d, 'day');
        });
    }

    private refreshCssSelectedDates(value: any[]) {
        let selectedDaysInView = [];
        if (value !== undefined && value !== null) {
            selectedDaysInView = value;
            if (value !== null) {
                selectedDaysInView = selectedDaysInView.map((val: Date) => {
                    return moment(val);
                });
                selectedDaysInView.forEach((val: Date) => {
                    const day = val;
                    this.days.forEach((d) => {
                        if (d.date.isSame(day)) {
                            d.mdp.selected = true;
                            return;
                        }
                    });
                });
            }
        }
    }
}
