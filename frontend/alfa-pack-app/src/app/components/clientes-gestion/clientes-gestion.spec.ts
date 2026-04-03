import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientesGestion } from './clientes-gestion';

describe('ClientesGestion', () => {
  let component: ClientesGestion;
  let fixture: ComponentFixture<ClientesGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientesGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
