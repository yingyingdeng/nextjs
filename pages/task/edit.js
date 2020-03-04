import React from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { connect } from 'react-redux'
import { Card, Form, PageHeader } from 'antd'
import moment from 'moment'

import { JWPApiService } from '../../lib'
import { getTaskInfoAction, saveFormAction, resetFormAction } from '../../actions'
import { JWPLayoutDefault, TaskForm } from '../../components'

const EditTaskForm = connect(({ form }) => {
  return {
    fields: form['editTask'] || {},
    formName: 'editTask',
  }
})(Form.create({
  name: 'editTask',
  onFieldsChange(props, changedFields) {
    const { dispatch, formName } = props

    dispatch(saveFormAction({
      name: formName,
      changedFields
    }))
  },
  mapPropsToFields(props) {
    const { fields } = props

    const formFields = {}
    Object.entries(fields).forEach(([k, v]) => {
      if (k === 'validRange') {
        v = Object.assign(
          {}, v, { value: v['value'].map((v) => moment(v)) }
        )
      }
      formFields[k] = Form.createFormField(v)
    })
    return formFields
  },
})(TaskForm))

class EditTaskPage extends React.Component {
  static async getInitialProps({ req, query, store }) {
    let jwpApiService
    if (req) {
      jwpApiService = new JWPApiService({ headers: { cookie: req.headers.cookie } })
    }
    const resp = await store.dispatch(getTaskInfoAction({
      jwpApiService, id: query.id
    }))
    const { task } = resp.data

    return { task }
  }

  executeWhenRehydrated() {
    const { dispatch, rehydrated, task } = this.props

    if (rehydrated) {
      const fields = {}
      const names = ['title', 'desc', 'coverFile', 'payAmount',
        'text', 'link', 'credentials']
      names.forEach((v) => {
        fields[v] = { name: v, value: task[v] }
      })
      fields['payAmount'] = { name: 'payAmount', value: task.payAmount / 100 }
      fields['validRange'] = { name: 'validRange', value: [moment(task.startAt), moment(task.stopAt)] }

      dispatch(resetFormAction({ name: 'editTask' }))
      dispatch(saveFormAction({ name: 'editTask', changedFields: fields }))
    } else {
      setTimeout(() => this.executeWhenRehydrated(), 100)
    }
  }

  componentDidMount() {
    this.executeWhenRehydrated()
  }

  render() {
    const { task } = this.props

    return (
      <div>
        <Head>
          <title key="title">编辑任务 - 及未支付</title>
        </Head>

        <JWPLayoutDefault {...this.props}>
          <PageHeader title="编辑任务" onBack={() => Router.back()} />

          <div style={{ padding: 24 }}>
            <Card bordered={false} >
              <EditTaskForm task={task} />
            </Card>
          </div>
        </JWPLayoutDefault>
      </div>
    )
  }
}

export default connect(({ _persist }) => {
  return {
    rehydrated: _persist && _persist.rehydrated,
  }
})(EditTaskPage)
