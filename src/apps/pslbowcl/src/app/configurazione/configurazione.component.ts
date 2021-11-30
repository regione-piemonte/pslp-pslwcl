import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'pslbowcl-configurazione',
  templateUrl: './configurazione.component.html'
})
export class ConfigurazioneComponent implements OnInit {
  constructor(
    private  readonly router: Router,
  ) { }

  ngOnInit() {
  }

  onIndietro() {
    this.router.navigateByUrl('/home');
 }
}
