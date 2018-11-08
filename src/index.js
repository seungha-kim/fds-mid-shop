import '@babel/polyfill' // 이 라인을 지우지 말아주세요!

import axios from 'axios'

const api = axios.create({
  baseURL: process.env.API_URL
})

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});

const templates = {
  layout: document.querySelector('#layout').content,
  loginForm: document.querySelector('#login-form').content,
  productList: document.querySelector('#product-list').content,
  productItem: document.querySelector('#product-item').content,
  productDetail: document.querySelector('#product-detail').content,
  detailImage: document.querySelector('#detail-image').content,
  cartList: document.querySelector('#cart-list').content,
  cartItem: document.querySelector('#cart-item').content,

}

const rootEl = document.querySelector('.root')

// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

// fragment를 받아서 layout에 넣은 다음 rootEl에 그려주는 함수
function drawFragment(frag) {
  const layoutFrag = document.importNode(templates.layout, true)
  const mainEl = layoutFrag.querySelector('.main')
  const signUpEl = layoutFrag.querySelector('.sign-up')
  const signInEl = layoutFrag.querySelector('.sign-in')
  const signOutEl = layoutFrag.querySelector('.sign-out')
  const cartEl = layoutFrag.querySelector('.cart')
  const allEl = layoutFrag.querySelector('.all')
  const topEl = layoutFrag.querySelector('.top')
  const pantsEl = layoutFrag.querySelector('.pants')
  const shoesEl = layoutFrag.querySelector('.shoes')

  signUpEl.addEventListener('click', e => {
    drawRegisterForm()
  })
  signInEl.addEventListener('click', e => {
    drawLoginForm()
  })
  signOutEl.addEventListener('click', e => {
    localStorage.removeItem('token')
    drawLoginForm()
  })
  cartEl.addEventListener('click', e => {
    drawCartList()
  })
  allEl.addEventListener('click', e => {
    console.log('all')
    drawProductList()
  })
  topEl.addEventListener('click', e => {
    console.log('top')
    drawProductList('top')
  })
  pantsEl.addEventListener('click', e => {
    drawProductList('pants')
  })
  shoesEl.addEventListener('click', e => {
    drawProductList('shoes')
  })

  mainEl.appendChild(frag)
  rootEl.textContent = ''
  rootEl.appendChild(layoutFrag)
  window.scrollTo(0, 0)
}

async function drawRegisterForm() {

}

async function drawLoginForm() {
  const frag = document.importNode(templates.loginForm, true)

  const loginFormEl = frag.querySelector('.login-form')

  loginFormEl.addEventListener('submit', async e => {
    e.preventDefault()
    const username = e.target.elements.username.value
    const password = e.target.elements.password.value
    const { data: { token } } = await api.post('/users/login', {
      username,
      password
    })
    localStorage.setItem('token', token)
    drawProductList()
  })

  drawFragment(frag)
}

async function drawProductList(category) {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.productList, true)

  // 2. 요소 선택
  const productListEl = frag.querySelector('.product-list')

  // 3. 필요한 데이터 불러오기
  const params = {}
  if (category) {
    params.category = category
  }
  const { data: productList } = await api.get('/products', {
    params
  })
  // 4. 내용 채우기
  for (const {
    id: productId, title, description, mainImgUrl
  } of productList) {
    // 1. 템플릿 복사
    const frag = document.importNode(templates.productItem, true)

    // 2. 요소 선택
    const productItemEl = frag.querySelector('.product-item')
    const mainImageEl = frag.querySelector('.main-image')
    const titleEl = frag.querySelector('.title')
    const descriptionEl = frag.querySelector('.description')

    // 3. 필요한 데이터 불러오기 - x
    // 4. 내용 채우기
    mainImageEl.setAttribute('src', mainImgUrl)
    titleEl.textContent = title
    descriptionEl.textContent = description

    // 5. 이벤트 리스너 등록하기
    productItemEl.addEventListener('click', e => {
      drawProductDetail(productId)
    })

    // 6. 템플릿을 문서에 삽입
    productListEl.appendChild(frag)
  }
  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  drawFragment(frag)
}

async function drawProductDetail(productId) {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.productDetail, true)

  // 2. 요소 선택
  const mainImageEl = frag.querySelector('.main-image')
  const titleEl = frag.querySelector('.title')
  const descriptionEl = frag.querySelector('.description')
  const cartFormEl = frag.querySelector('.cart-form')
  const detailImageListEl = frag.querySelector('.detail-image-list')
  const selectEl = frag.querySelector('.option')
  const totalEl = frag.querySelector('.total')
  const quantityEl = frag.querySelector('.quantity')

  // 3. 필요한 데이터 불러오기
  const { data: {
    title,
    description,
    mainImgUrl,
    detailImgUrls,
    options
  } } = await api.get(`/products/${productId}`, {
    params: {
      _embed: 'options'
    }
  })

  // 4. 내용 채우기
  mainImageEl.setAttribute('src', mainImgUrl)
  titleEl.textContent = title
  descriptionEl.textContent = description

  for (const url of detailImgUrls) {
    const frag = document.importNode(templates.detailImage, true)

    const detailImageEl = frag.querySelector('.detail-image')

    detailImageEl.setAttribute('src', url)

    detailImageListEl.appendChild(frag)
  }

  for (const { id, title, price } of options) {
    const optionEl = document.createElement('option')
    optionEl.setAttribute('value', id)
    optionEl.textContent = `${title} (${price}원)`
    selectEl.appendChild(optionEl)
  }

  // 5. 이벤트 리스너 등록하기
  function calculateTotal() {
    // 선택된 option 태그에 해당하는 옵션 객체를 찾는다.
    const optionId = parseInt(selectEl.value)
    const option = options.find(o => o.id === optionId)
    // 찾지 못하면 함수를 종료시킨다.
    if (!option) return
    // 수량을 가져온다.
    const quantity = parseInt(quantityEl.value)
    // 총액을 계산해서 표시한다.
    totalEl.textContent = option.price * quantity
  }
  selectEl.addEventListener('change', calculateTotal)
  quantityEl.addEventListener('input', calculateTotal)

  cartFormEl.addEventListener('submit', async e => {
    e.preventDefault()
    const optionId = parseInt(selectEl.value)
    const quantity = parseInt(quantityEl.value)
    await api.post('/cartItems', {
      optionId,
      quantity,
      ordered: false
    })
    if (confirm('장바구니에 담긴 상품을 확인하시겠습니까?')) {
      drawCartList()
    }
  })

  // 6. 템플릿을 문서에 삽입
  drawFragment(frag)
}

async function drawCartList() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.cartList, true)

  // 2. 요소 선택
  const cartListEl = frag.querySelector('.cart-list')

  // 3. 필요한 데이터 불러오기
  const { data: cartItemList } = await api.get('/cartItems', {
    params: {
      ordered: 'false'
    }
  })

  const optionIds = cartItemList.map(c => c.optionId)
  const params = new URLSearchParams()
  optionIds.forEach(optionId => params.append('id', optionId))
  params.append('_expand', 'product')
  const { data: optionList } = await api.get('/options', {
    params
  })

  // 4. 내용 채우기
  for (const cartItem of cartItemList) {
    const frag = document.importNode(templates.cartItem, true)

    const mainImageEl = frag.querySelector('.main-image')
    const titleEl = frag.querySelector('.title')
    const descriptionEl = frag.querySelector('.description')
    const optionEl = frag.querySelector('.option')
    const quantityEl = frag.querySelector('.quantity')
    const quantityFormEl = frag.querySelector('.quantity-form')
    const priceEl = frag.querySelector('.price')
    const deleteEl = frag.querySelector('.delete')

    const option = optionList.find(o => o.id === cartItem.optionId)

    mainImageEl.setAttribute('src', option.product.mainImgUrl)
    titleEl.textContent = option.product.title
    descriptionEl.textContent = option.product.description
    optionEl.textContent = option.title
    quantityEl.value = cartItem.quantity
    priceEl.textContent = parseInt(cartItem.quantity) * option.price

    quantityFormEl.addEventListener('submit', async e => {
      e.preventDefault()
      const quantity = parseInt(e.target.elements.quantity.value)
      if (Number.isNaN(quantity)) {
        alert('수량이 잘못되었습니다. 다시 확인해주십시오.')
        return
      }
      if (confirm('정말 수정하시겠습니까?')) {
        await api.patch(`/cartItems/${cartItem.id}`, {
          quantity
        })
        drawCartList()
      }
    })

    deleteEl.addEventListener('click', async e => {
      if (confirm('정말 삭제하시겠습니까?')) {
        await api.delete(`/cartItems/${cartItem.id}`)
        drawCartList()
      }
    })

    cartListEl.appendChild(frag)
  }
  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  drawFragment(frag)
}

drawProductList()
