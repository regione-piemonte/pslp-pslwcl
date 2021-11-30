import { Component, forwardRef, HostBinding, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';

interface Idata {
  month: number;
  year: number;
}
@Component({
  selector: 'pslshare-month-date-picker',
  templateUrl: './month-date-picker.component.html',
  styleUrls: ['./month-date-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonthDatePickerComponent),
      multi: true
    }
  ]
})
export class MonthDatePickerComponent implements OnInit {

  data: Idata;
  dataTxt: string;
  separator: string;
  monthFirst: boolean;
  place: number;

  isyear  = false;
  incr = 0;
  showPicker = false;


  months: string[] = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  // Allow the input to be disabled, and when it is make it somewhat transparent.
  @Input() disabled = false;
  @Input() mask = "mm/yyyy";
  @Input() dato: string;


  constructor() {
    this.separator = this.mask.replace(/m|y|M/gi, "");
    this.monthFirst = this.mask.indexOf('y') > 0;
    this.place = this.mask.indexOf(this.separator);
  }
  ngOnInit(): void {
     this.change(this.dato);
  }

  change(value: string) {
    value = this.separator == " " ? value.replace(/\.|-|\//, " ") :
          this.separator == "/" ? value.replace(/\.|-| /, "/") :
          this.separator == "-" ? value.replace(/\.| |\//, "-") :
          value.replace(/.| |\/ /, "-");

    const lastchar = value.substr(value.length - 1);
    if (lastchar === this.separator && value.length <= this.place) {
      if (this.monthFirst) {
        value = "0" + value;
      }
    }
    if (value.length > this.place && value.indexOf(this.separator) < 0) {
      value = value.substr(0, value.length - 1) + this.separator + lastchar;
    }
    this.dataTxt = value;
    const items = value.split(this.separator);
    if (items.length == 2) {
      const year = this.monthFirst ? items[1] : items[0];
      const month = this.monthFirst ? items[0] : items[1];
      let imonth = this.months.indexOf(month);
      if ((imonth) < 0) {
        imonth = parseInt(month);
      } else {
        imonth = imonth + 1;
      }

      const iyear = parseInt(year);
      if (!isNaN(iyear)) {
        /* if (iyear < 100)  {
          iyear = iyear + 2000;
        } */
        this.data = {
          year: iyear,
          month: imonth
        };
        if (iyear > 1900) {
           this.incr = this.getIncr(this.data.year);
        }
      }
    }
    if (this.data.month >= 1 && this.data.month <= 12) {
      this.dataTxt = this.formatData(this.data);
    }
    // this.writeValue(this.data);

  }
  togglePicker() {
    this.showPicker = !this.showPicker;
  }

  selectYearMonth($event, index: number) {
    if (this.isyear) {
      $event.stopPropagation();
      this.data.year = index + this.incr;
      this.dataTxt = this.formatData(this.data);
      this.isyear = false;
      this.incr = this.getIncr(this.data.year);

    } else {
       this.data.month = index + 1;
       this.dataTxt = this.formatData(this.data);
       this.showPicker = false;
    }
  }
  showYear($event: any, show: boolean) {
    $event.stopPropagation();
    this.isyear = !this.isyear;
  }
  addYear($event: any, incr: number) {
    $event.stopPropagation();
    const year = this.isyear ? this.data.year + 10 * incr : this.data.year + incr;
    console.log(year);
    this.data.year = year;
    this.incr = this.getIncr(year);
    this.dataTxt = this.formatData(this.data);
  }
  onChange = (data: Idata) => {
    this.data = data;
    this.dataTxt = this.monthFirst ? "" + data.month + this.separator + data.year :
      "" + data.year + this.separator + data.month;
      this.incr = this.getIncr(this.data.year);
  }

  getIncr(year: number): number {
    console.log("*", (year - year % 10) - 1);
    return (year - year % 10) - 1;
  }
  formatData(data: Idata): string  {
    const monthTxt = data.month < 10 ? "0" + data.month : "" + data.month;
    return  this.monthFirst ?  monthTxt + this.separator + data.year :
    "" + data.year + this.separator + monthTxt;

  }
  // Function to call when the input is touched (when a star is clicked).
  onTouched = () => { };

  writeValue(data: Idata): void {
    this.data = data;
    this.onChange(this.data);
  }

  // Allows Angular to register a function to call when the model (rating) changes.
  // Save the function as a property to call later here.
  registerOnChange(fn: (data: Idata) => void): void {
    this.onChange = fn;
  }

  // Allows Angular to register a function to call when the input has been touched.
  // Save the function as a property to call later here.
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }



}
