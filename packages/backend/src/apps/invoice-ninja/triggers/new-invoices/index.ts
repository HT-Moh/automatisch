import Crypto from 'crypto';
import isEmpty from 'lodash/isEmpty';
import defineTrigger from '../../../../helpers/define-trigger';

type Response = {
  data: {
    data: {
      id: string;
      event_id: string;
      target_url: string;
      format: string;
    };
  };
};

export default defineTrigger({
  name: 'New invoices',
  key: 'newInvoices',
  type: 'webhook',
  description: 'Triggers when a new invoice is added.',
  arguments: [],

  async run($) {
    const dataItem = {
      raw: $.request.body,
      meta: {
        internalId: Crypto.randomUUID(),
      },
    };

    $.pushTriggerItem(dataItem);
  },

  async testRun($) {
    const lastExecutionStep = await $.getLastExecutionStep();

    if (!isEmpty(lastExecutionStep?.dataOut)) {
      $.pushTriggerItem({
        raw: lastExecutionStep.dataOut,
        meta: {
          internalId: '',
        },
      });
    }
  },

  async registerHook($) {
    const CREATE_INVOICE_EVENT_ID = '2';

    const payload = {
      target_url: $.webhookUrl,
      event_id: CREATE_INVOICE_EVENT_ID,
      format: 'JSON',
      rest_method: 'post',
    };

    const response: Response = await $.http.post('/v1/webhooks', payload);

    await $.flow.setRemoteWebhookId(response.data.data.id);
  },

  async unregisterHook($) {
    await $.http.delete(`/v1/webhooks/${$.flow.remoteWebhookId}`);
  },
});
