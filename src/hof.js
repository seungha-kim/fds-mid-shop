let loadingCount = 0

// 로딩 인디케이터 표시를 위한 고차 함수
// 로딩 인디케이터를 적용하고 싶은 비동기 함수를 withLoading으로 둘러싸주면 된다.
export const withLoading = f => async (...args) => {
  if (loadingCount === 0) {
    document.body.classList.add('loading')
  }
  loadingCount++
  try {
    const result = await f(...args)
    return result
  } finally {
    loadingCount--
    if (loadingCount === 0) {
      document.body.classList.remove('loading')
    }
  }
}

export const withAuth = f => async (...args) => {
  if (localStorage.getItem('token')) {
    return f(...args)
  } else {
    if (args[0] instanceof Event) {
      args[0].preventDefault()
    }
    alert('로그인이 되지 않았습니다. 먼저 로그인을 해 주세요.')
  }
}
