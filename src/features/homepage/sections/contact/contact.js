import { icon } from '../../../../components/ui/icon.js';

export function contact() {
  return `<section class="contact-section" id="contact" aria-labelledby="contact-heading">
    <div class="contact-copy"><p class="section-label">A local team, a second perspective</p><h2 id="contact-heading" tabindex="-1">Talk to an Intrigue agent about this deal.</h2><p>Have questions about your assumptions or want to discuss the property? Share the details and what you would like to talk through.</p><div class="contact-context">${icon('message')}<p>You bring the property.<br>We can help you think through the questions.</p></div><p class="contact-alternative">Ready for a real conversation?<br><a href="https://www.intriguepm.com/contact/" target="_blank" rel="noopener noreferrer">Contact Intrigue on the main website <span class="sr-only">(opens in a new tab)</span>${icon('arrow')}</a></p></div>
    <div class="contact-panel"><h3>Let's look at your next step.</h3><p class="contact-demo-note" id="contact-demo-note">Demo form only. You can check your message here, but nothing will be sent.</p>
      <form id="deal-contact-form" aria-describedby="contact-demo-note" novalidate>
        <div class="contact-fields">
          <div class="form-field"><label for="contact-name">Name <span>(required)</span></label><input id="contact-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="100" aria-describedby="contact-name-error"><p class="field-error" id="contact-name-error" hidden></p></div>
          <div class="form-field"><label for="contact-email">Email <span>(required)</span></label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" aria-describedby="contact-email-error"><p class="field-error" id="contact-email-error" hidden></p></div>
          <div class="form-field"><label for="contact-phone">Phone <span>(optional)</span></label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" aria-describedby="contact-phone-error"><p class="field-error" id="contact-phone-error" hidden></p></div>
          <div class="form-field"><label for="contact-property">Property address <span>(optional)</span></label><input id="contact-property" name="property" type="text" autocomplete="street-address" maxlength="250" aria-describedby="contact-property-error"><p class="field-error" id="contact-property-error" hidden></p></div>
          <div class="form-field form-field--full"><label for="contact-message">Message <span>(required)</span></label><textarea id="contact-message" name="message" rows="4" required minlength="10" maxlength="2000" aria-describedby="contact-message-help contact-message-error"></textarea><p class="field-help" id="contact-message-help">Tell us what you are considering or where you would like a second perspective.</p><p class="field-error" id="contact-message-error" hidden></p></div>
        </div>
        <div class="form-action"><button class="button button--dark" type="submit">Check my message ${icon('arrow')}</button><span>Browser-only validation.<br>No message is sent or stored.</span></div>
        <p class="form-feedback" id="contact-feedback" role="status" tabindex="-1" hidden></p>
      </form>
    </div>
  </section>`;
}

/** Local-only form: no API calls, persistence, analytics, or remote submission. */
export function initializeContact() {
  const form = document.querySelector('#deal-contact-form');
  const feedback = document.querySelector('#contact-feedback');
  const fields = [...form.querySelectorAll('input, textarea')];
  let attempted = false;

  function errorFor(field) {
    const value = field.value.trim();
    if (field.required && !value) return `Please enter your ${field.name === 'name' ? 'name' : field.name === 'email' ? 'email address' : 'message'}.`;
    if (field.name === 'name' && value.length < 2) return 'Please enter a name with at least 2 characters.';
    if (field.name === 'email' && field.validity.typeMismatch) return 'Please enter a valid email address, such as name@example.com.';
    if (field.name === 'message' && value.length < 10) return 'Please add a little more detail, at least 10 characters.';
    if (field.name === 'phone' && value) {
      const digits = value.replace(/\D/g, '');
      if (!/^[+()\d\s.-]+$/.test(value) || digits.length < 7 || digits.length > 15) return 'Use 7 to 15 digits, with spaces, +, parentheses, or hyphens if needed.';
    }
    if (field.maxLength > 0 && value.length > field.maxLength) return `Please keep this under ${field.maxLength + 1} characters.`;
    return '';
  }

  function validate(field) {
    const error = errorFor(field);
    const message = document.querySelector(`#${field.id}-error`);
    message.textContent = error;
    message.hidden = !error;
    field.setAttribute('aria-invalid', String(Boolean(error)));
    return !error;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    attempted = true;
    feedback.hidden = true;
    const validity = fields.map(validate);
    const firstInvalid = validity.indexOf(false);
    if (firstInvalid !== -1) {
      fields[firstInvalid].focus();
      return;
    }
    feedback.textContent = 'Your message is ready. This is a demo form, so nothing has been sent to Intrigue. Use the main website contact link if you would like to get in touch.';
    feedback.hidden = false;
    feedback.focus();
  });

  fields.forEach(field => {
    field.addEventListener('input', () => {
      feedback.hidden = true;
      if (attempted) validate(field);
    });
    field.addEventListener('blur', () => { if (field.value || attempted) validate(field); });
  });
}
