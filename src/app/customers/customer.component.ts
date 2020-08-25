import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, AbstractControl, ValidatorFn } from '@angular/forms';

import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { range: true };
    }
    return null;
  };
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmEmail = c.get('confirmEmail');
  if (confirmEmail.value === emailControl.value) {
    return null;
  }
  if (emailControl.pristine || confirmEmail.pristine) {
    return null;
  }
  return { match: true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();

  emailMessage: string;

  private validationMessages = {
    required: 'Please enter your email addrsss',
    email: 'Please enter a valid email address'
  };

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required, Validators.email]],
      }, { validator: emailMatcher }),
      sendCatalog: true,
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      addresses: this.fb.array([this.buildAddresses()])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      this.setNotification(value);
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm));
  }

  buildAddresses(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: ['', Validators.required],
      street2: ['', Validators.required],
      zip: ['', Validators.required],
    });
  }

  addAddresses(): void {
    this.addresses.push(this.buildAddresses());
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Andrei'
    });
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }
}
