const pupeteer = require('puppeteer')
const { sessionFactory } = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
  static async build() {
    const browser = await pupeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    })

    const page = await browser.newPage()
    const customPage = new CustomPage(page)

    return new Proxy(customPage, {
      get(target, property) {
        return target[property] || browser[property] || page[property]
      },
    })
  }

  constructor(page) {
    this.page = page
  }

  async login() {
    const user = await userFactory()
    const { session, sig } = await sessionFactory(user)
    await this.page.setCookie({ name: 'session', value: session })
    await this.page.setCookie({ name: 'session.sig', value: sig })
    await this.page.goto('http://localhost:3000/blogs')
    await this.page.waitFor('a[href="/auth/logout"]')
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML)
  }

  get(path) {
    return this.page.evaluate((pathRoute) => {
      return fetch(pathRoute, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json())
    }, path)
  }

  post(path, data) {
    return this.page.evaluate(
      (pathRoute, bodyData) => {
        return fetch(pathRoute, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        }).then((res) => res.json())
      },
      path,
      data
    )
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        this[method](path, data)
      })
    )
  }
}

module.exports = CustomPage
