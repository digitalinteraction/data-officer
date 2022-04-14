<script lang="ts" setup>
import { ref } from 'vue'
import AltLayout from '../components/alt-layout.vue'
import { Routes, config } from '../utils'

const formAction = new URL('auth/register', config.SERVER_URL).toString()

const fullName = ref('')
const email = ref('')
const phoneNumber = ref('')
const reminders = ref<string[]>([])
const reminderDays = ref<string[]>([])
const reminderHours = ref<string[]>([])
const consent = ref(false)

const allDays = [
  { value: '1', name: 'Monday' },
  { value: '2', name: 'Tuesday' },
  { value: '3', name: 'Wednesday' },
  { value: '4', name: 'Thursday' },
  { value: '5', name: 'Friday' },
  { value: '6', name: 'Saturday' },
  { value: '0', name: 'Sunday' },
]

const allTimes = [
  { value: '8', name: '8am' },
  { value: '12', name: '12pm' },
  { value: '15', name: '3pm' },
  { value: '18', name: '6pm' },
]

const action = ref('none')

function buildCron(days: string[], hours: string[]) {
  return `0 ${hours.join(',')} * * ${days.join(',')}`
}

async function onSubmit(event: Event) {
  event.preventDefault()

  const noReminders =
    reminders.value.length < 1 ||
    reminderDays.value.length < 1 ||
    reminderHours.value.length < 1

  const msg = `
    You have not selected any reminders, are you sure you want to continue?
  `.trim()
  if (noReminders && !confirm(msg)) return

  await fetch(formAction, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      fullName: fullName.value,
      email: email.value,
      phoneNumber: phoneNumber.value ? phoneNumber.value : null,
      reminderSchedule: buildCron(reminderDays.value, reminderHours.value),
      reminders: {
        email: reminders.value.includes('email'),
        sms: reminders.value.includes('sms'),
      },
    }),
  }).then(
    (res) => {
      action.value = res.ok ? 'success' : 'error'
    },
    (error) => {
      console.error(error)
      action.value = 'error'
    }
  )
}

function startAgain() {
  fullName.value = ''
  email.value = ''
  phoneNumber.value = ''
  reminders.value = []
  reminderDays.value = []
  reminderHours.value = []
  consent.value = false
  action.value = 'none'
}
</script>

<template>
  <AltLayout>
    <h1>Register</h1>
    <p>
      Already have an account?
      <router-link :to="Routes.login">Log in</router-link>
    </p>
    <p class="formErrorMessage" v-if="action === 'error'">
      Something went wrong, please check your form and try again
    </p>
    <div class="formSuccessMessage" v-if="action === 'success'">
      <p>
        Registration submitted! Please check your email for a verification
        email.
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
              v-model="fullName"
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
              v-model="email"
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
              v-model="phoneNumber"
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
                v-model="reminders"
              />
              <span>Notify me by email</span>
            </label>
            <label for="smsReminders" class="checkbox">
              <input
                type="checkbox"
                id="smsReminders"
                value="sms"
                v-model="reminders"
              />
              <span>Notify me by SMS</span>
            </label>
          </div>

          <div class="checkboxGroup">
            <p class="checkboxGroup-label">Days</p>
            <label class="checkbox" v-for="item in allDays" :for="item.id">
              <input
                type="checkbox"
                :id="item.value"
                name="reminderDays"
                v-model="reminderDays"
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
                :id="item.value"
                name="reminderHours"
                v-model="reminderHours"
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
              v-model="consent"
            />
            <span
              >I have read and agree to take part in the DataDiaries study</span
            >
          </label>
        </fieldset>

        <input
          type="submit"
          class="primaryButton"
          name="register"
          value="Register"
        />
      </stack-layout>
    </form>
  </AltLayout>
</template>
