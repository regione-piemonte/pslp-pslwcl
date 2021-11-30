import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ProfilingYG, SchedaAnagraficoProfessionale } from '@pslwcl/pslapi'; // NOSONAR evita falso positivo rule typescript:S4328
import { Router } from '@angular/router';
import { CommonPslpService } from '@pslwcl/pslservice';

@Component({
  selector: 'app-conferma-profiling',
  templateUrl: './conferma-profiling.component.html'
})
export class ConfermaProfilingComponent implements OnInit {
  @Output() loaded = new EventEmitter();
  sap: SchedaAnagraficoProfessionale;

  age: number;
  profiling: ProfilingYG;
  profilingPresente: boolean;

  constructor(
    private readonly router: Router,
    private readonly commonPslpService: CommonPslpService
  ) { }

  async ngOnInit() {
    const [sap, age, profiling] = await Promise.all([
      this.commonPslpService.getSap$(),
      this.commonPslpService.age$(),
      this.commonPslpService.getProfiloResult$()
    ]);
    this.sap = sap;
    this.age = age;
    this.profiling = profiling;
    this.loaded.emit();
  }

  /**
   * Determines whether profiling on
   */
  onProfiling() {
    this.router.navigateByUrl('/garanzia-giovani/profiling');
  }
}
