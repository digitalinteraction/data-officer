<script lang="ts" setup>
import { ref } from 'vue'
import AltLayout from '../components/alt-layout.vue'
import { Routes, config, FormState } from '../utils'

const formState = ref<FormState>('pending')
const formAction = new URL('auth/register', config.SERVER_URL).toString()

function blankSubmission() {
  return {
    fullName: '',
    email: '',
    phoneNumber: '',
    reminders: [] as string[],
    reminderDays: [] as string[],
    reminderHours: [] as string[],
    consent: false,
  }
}

const submission = ref(blankSubmission())

const allDays = [
  { value: '1', id: 'mon', name: 'Monday' },
  { value: '2', id: 'tue', name: 'Tuesday' },
  { value: '3', id: 'wed', name: 'Wednesday' },
  { value: '4', id: 'thur', name: 'Thursday' },
  { value: '5', id: 'fri', name: 'Friday' },
  { value: '6', id: 'sat', name: 'Saturday' },
  { value: '0', id: 'sun', name: 'Sunday' },
]

const allTimes = [
  { value: '8', id: '8am', name: '8am' },
  { value: '12', id: '12pm', name: '12pm' },
  { value: '15', id: '3pm', name: '3pm' },
  { value: '18', id: '6pm', name: '6pm' },
]

function buildCron(days: string[], hours: string[]) {
  return `0 ${hours.join(',')} * * ${days.join(',')}`
}

async function onSubmit(event: Event) {
  event.preventDefault()

  const noReminders =
    submission.value.reminders.length < 1 ||
    submission.value.reminderDays.length < 1 ||
    submission.value.reminderHours.length < 1

  const msg = `
    You have not selected any reminders, are you sure you want to continue?
  `.trim()
  if (noReminders && !confirm(msg)) return

  formState.value = 'loading'

  const {
    fullName,
    email,
    phoneNumber,
    reminderDays,
    reminderHours,
    reminders,
  } = submission.value

  await fetch(formAction, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber ? phoneNumber : null,
      reminderSchedule: buildCron(reminderDays, reminderHours),
      reminders: {
        email: reminders.includes('email'),
        sms: reminders.includes('sms'),
      },
    }),
  }).then(
    (res) => {
      formState.value = res.ok ? 'success' : 'error'
    },
    (error) => {
      console.error(error)
      formState.value = 'error'
      window.scrollTo({ top: 0 })
    }
  )
}
function startAgain() {
  submission.value = blankSubmission()
  formState.value = 'pending'
}
</script>

<template>
  <AltLayout class="registerView">
    <h1>Register</h1>
    <p>
      Already have an account?
      <router-link :to="Routes.login">Log in</router-link>
    </p>
    <p class="formErrorMessage" v-if="formState === 'error'">
      Something went wrong, please check your form and try again
    </p>
    <div class="formSuccessMessage" v-if="formState === 'success'">
      <p>
        Thank you for taking part, your registration has been submitted. Please
        check your email for a verification email.
      </p>
      <p>
        <a href="#" @click.prevent="startAgain">Start again?</a>
      </p>
    </div>
    <form v-else @submit="onSubmit">
      <p>
        Use this form to sign up for the DataDiaries study. Lorem ipsum sil dor
        amet...
      </p>
      <stack-layout space="var(--s1)">
        <fieldset>
          <legend>Your details</legend>
          <p class="fieldset-hint">
            These questions let us identify you so you can sign in and use the
            pilot.
          </p>

          <div class="field">
            <label for="fullName">
              <span class="field-label">Full name</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              v-model="submission.fullName"
            />
          </div>

          <div class="field">
            <label for="email">
              <span class="field-label">Email address</span>
              <span class="field-hint"
                >You'll use this to log in to DataDiaries</span
              >
            </label>
            <input
              type="text"
              id="email"
              name="email"
              required
              v-model="submission.email"
            />
          </div>

          <div class="field">
            <label for="phoneNumber">
              <span class="field-label">Phone number</span>
              <span class="field-hint">
                Optional, to recieve reminders by SMS.
              </span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              v-model="submission.phoneNumber"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Reminders</legend>
          <p class="fieldset-hint">
            Reminders are a key part of this study, choose the method that will
            remind you best. We'll also email you separately regarding the
            study.
          </p>

          <div class="checkboxGroup">
            <label for="emailReminders" class="checkbox">
              <input
                type="checkbox"
                id="emailReminders"
                value="email"
                v-model="submission.reminders"
              />
              <span>Notify me by email</span>
            </label>
            <label for="smsReminders" class="checkbox">
              <input
                type="checkbox"
                id="smsReminders"
                value="sms"
                v-model="submission.reminders"
              />
              <span>Notify me by SMS</span>
            </label>
          </div>

          <div class="checkboxGroup">
            <p class="checkboxGroup-label">Days</p>
            <label class="checkbox" v-for="item in allDays" :for="item.id">
              <input
                type="checkbox"
                :id="item.id"
                name="reminderDays"
                v-model="submission.reminderDays"
                :value="item.value"
              />
              <span>{{ item.name }}</span>
            </label>
          </div>

          <div class="checkboxGroup">
            <p class="checkboxGroup-label">Times</p>
            <label class="checkbox" v-for="item in allTimes" :for="item.id">
              <input
                type="checkbox"
                :id="item.id"
                name="reminderHours"
                v-model="submission.reminderHours"
                :value="item.value"
              />
              <span>{{ item.name }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Consent</legend>
          <p class="fieldset-hint">
            Please ensure you have read and understand the study information
            before taking part.
          </p>

          <label class="checkbox" for="consent">
            <input
              type="checkbox"
              id="consent"
              name="consent"
              required
              v-model="submission.consent"
            />
            <span
              >I have read and agree to take part in the DataDiaries study</span
            >
          </label>
        </fieldset>

        <cluster-layout space="var(--s-1)">
          <input
            type="submit"
            :disabled="formState === 'loading'"
            class="primaryButton"
            name="register"
            value="Register"
          />
          <router-link :to="Routes.home" class="secondaryButton">
            Cancel
          </router-link>
        </cluster-layout>
      </stack-layout>
    </form>
  </AltLayout>
</template>

<style>
.registerView label[for='consent'] {
  max-width: unset;
}
</style>
