import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Authorities } from './authorities';

describe('Authorities', () => {
  let component: Authorities;
  let fixture: ComponentFixture<Authorities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authorities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Authorities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
