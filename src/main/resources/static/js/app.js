// 创建 Vue 应用
const { createApp, ref, reactive, onMounted, computed } = Vue;

// 获取ElementPlus的ElMessage组件
const ElMessage = ElementPlus.ElMessage;

const App = {
  setup() {
    // 响应式数据
    const searchForm = reactive({
      tsCode: '',
      tradeDate: '',
      pctChgMin: '',
      pctChgMax: '',
      priceMin: '',
      priceMax: '',
    });

    const stockResponse = ref({
      totalCount: 0,
      limitUpCount: 0,
      limitDownCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      stocks: []
    });

    const currentPage = ref(1);
    const pageSize = ref(9); // 每页显示9个股票，形成3x3九宫格
    const loading = ref(false);
    const activeTab = ref('table');
    const currentDataType = ref('normal'); // 可能的值: normal, halfYearLine, yearLine

    // 计算属性
    const positiveRate = computed(() => {
      if (stockResponse.value.totalCount === 0) return '0.00%';
      const rate = (stockResponse.value.positiveCount / stockResponse.value.totalCount) * 100;
      return rate.toFixed(2) + '%';
    });

    const negativeRate = computed(() => {
      if (stockResponse.value.totalCount === 0) return '0.00%';
      const rate = (stockResponse.value.negativeCount / stockResponse.value.totalCount) * 100;
      return rate.toFixed(2) + '%';
    });

    const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }));

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      if (typeof date === 'string' && date.length === 8) {
        return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
      }
      return date;
    };

    // 处理涨跌颜色
    const getPriceChangeClass = (pctChg) => {
      if (!pctChg && pctChg !== 0) return 'price-neutral';
      return parseFloat(pctChg) > 0 ? 'price-up' :
        parseFloat(pctChg) < 0 ? 'price-down' : 'price-neutral';
    };

    // 获取数据的方法
    const loadData = () => {
      loading.value = true;

      // 构建查询参数
      const params = new URLSearchParams();
      if (searchForm.tsCode) params.append('tsCode', searchForm.tsCode);
      if (searchForm.tradeDate) params.append('tradeDate', searchForm.tradeDate);
      if (searchForm.pctChgMin) params.append('pctChgMin', searchForm.pctChgMin);
      if (searchForm.pctChgMax) params.append('pctChgMax', searchForm.pctChgMax);
      if (searchForm.priceMin) params.append('priceMin', searchForm.priceMin);
      if (searchForm.priceMax) params.append('priceMax', searchForm.priceMax);
      params.append('pageNum', currentPage.value);
      params.append('size', pageSize.value);

      // 发送请求
      fetch(`/api/stock/data?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
          // 转换数据结构
          stockResponse.value = {
            totalCount: data.stock_count || 0,
            limitUpCount: 0,
            limitDownCount: 0,
            positiveCount: 0,
            negativeCount: 0,
            stocks: processGridData(data)
          };

          // 如果有数据，准备图表数据
          if (stockResponse.value.stocks && stockResponse.value.stocks.length > 0) {
            renderCharts();
          }
        })
        .catch(error => {
          console.error('加载数据失败:', error);
          ElMessage.error('加载数据失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // 处理后端返回的grid_data格式
    const processGridData = (data) => {
      if (!data || !data.grid_data || !data.grid_data.length) return [];

      const columnNames = data.column_names || [
        'tsCode', 'tradeDate', 'open', 'high', 'low', 'close',
        'preClose', 'pctChg', 'vol', 'amount', 'turnoverRate',
        'ma5', 'ma10', 'ma120', 'ma250'
      ];

      return data.grid_data.map(row => {
        if (!row || !row.length) return null;
        const stockData = {};

        // 将每一列数据按照列名映射到对象
        row[0].forEach((value, index) => {
          if (index < columnNames.length) {
            const key = columnNames[index];
            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            stockData[camelCaseKey] = value;
          }
        });

        // 添加半年线和年线数据
        if (columnNames.includes('ma120')) {
          stockData.halfYearLine = stockData.ma120;
        }
        if (columnNames.includes('ma250')) {
          stockData.yearLine = stockData.ma250;
        }

        return stockData;
      }).filter(item => item !== null);
    };

    // 加载涨停数据
    const loadLimitUpData = () => {
      loading.value = true;
      currentDataType.value = 'limitUp';

      fetch(`/api/stock/limit-up?pageNum=${currentPage.value}&size=${pageSize.value}`)
        .then(response => response.json())
        .then(data => {
          // 转换数据结构
          stockResponse.value = {
            totalCount: data.stock_count || 0,
            limitUpCount: data.stock_count || 0,
            limitDownCount: 0,
            positiveCount: 0,
            negativeCount: 0,
            stocks: processGridData(data)
          };

          if (stockResponse.value.stocks && stockResponse.value.stocks.length > 0) {
            renderCharts();
          }
        })
        .catch(error => {
          console.error('加载涨停数据失败:', error);
          ElMessage.error('加载涨停数据失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // 加载跌停数据
    const loadLimitDownData = () => {
      loading.value = true;
      currentDataType.value = 'limitDown';

      fetch(`/api/stock/limit-down?pageNum=${currentPage.value}&size=${pageSize.value}`)
        .then(response => response.json())
        .then(data => {
          // 转换数据结构
          stockResponse.value = {
            totalCount: data.stock_count || 0,
            limitUpCount: 0,
            limitDownCount: data.stock_count || 0,
            positiveCount: 0,
            negativeCount: 0,
            stocks: processGridData(data)
          };

          if (stockResponse.value.stocks && stockResponse.value.stocks.length > 0) {
            renderCharts();
          }
        })
        .catch(error => {
          console.error('加载跌停数据失败:', error);
          ElMessage.error('加载跌停数据失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // 加载半年线数据
    const loadHalfYearLineData = () => {
      loading.value = true;
      currentDataType.value = 'halfYearLine';

      fetch(`/api/stock/half-year-line?pageNum=${currentPage.value}&size=${pageSize.value}`)
        .then(response => response.json())
        .then(data => {
          // 转换数据结构
          stockResponse.value = {
            totalCount: data.stock_count || 0,
            limitUpCount: 0,
            limitDownCount: 0,
            positiveCount: 0,
            negativeCount: 0,
            stocks: processGridData(data)
          };

          if (stockResponse.value.stocks && stockResponse.value.stocks.length > 0) {
            renderCharts();
          }
        })
        .catch(error => {
          console.error('加载半年线数据失败:', error);
          ElMessage.error('加载半年线数据失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // 加载年线数据
    const loadYearLineData = () => {
      loading.value = true;
      currentDataType.value = 'yearLine';

      fetch(`/api/stock/year-line?pageNum=${currentPage.value}&size=${pageSize.value}`)
        .then(response => response.json())
        .then(data => {
          // 转换数据结构
          stockResponse.value = {
            totalCount: data.stock_count || 0,
            limitUpCount: 0,
            limitDownCount: 0,
            positiveCount: 0,
            negativeCount: 0,
            stocks: processGridData(data)
          };

          if (stockResponse.value.stocks && stockResponse.value.stocks.length > 0) {
            renderCharts();
          }
        })
        .catch(error => {
          console.error('加载年线数据失败:', error);
          ElMessage.error('加载年线数据失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    };

    // 处理分页变化
    const handlePageChange = (page) => {
      currentPage.value = page;

      if (currentDataType.value === 'normal') {
        loadData();
      } else if (currentDataType.value === 'limitUp') {
        loadLimitUpData();
      } else if (currentDataType.value === 'limitDown') {
        loadLimitDownData();
      } else if (currentDataType.value === 'halfYearLine') {
        loadHalfYearLineData();
      } else if (currentDataType.value === 'yearLine') {
        loadYearLineData();
      }
    };

    // 重置搜索表单
    const resetForm = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = '';
      });
      currentPage.value = 1;
      currentDataType.value = 'normal';
      loadData();
    };

    // 准备图表数据
    const prepareChartData = (stock) => {
      if (!stock) return null;

      // 我们需要包含更多天的数据，但现在返回的是单日数据
      // 这里创建模拟的前后20天数据
      const data = {
        categoryData: [],
        values: [],
        volumes: [],
        ma5: [],
        ma10: [],
        ma20: [],
        ma60: []
      };

      // 假设当前日期是中间日期，创建前后20天的数据
      const baseDate = new Date(formatDate(stock.tradeDate));

      // 生成前20天和后20天的日期
      for (let i = -20; i <= 20; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + i);

        // 格式化日期为YYYY-MM-DD
        const dateStr = currentDate.toISOString().split('T')[0];
        data.categoryData.push(dateStr);

        // 如果是当前股票的实际数据，使用真实值
        if (i === 0) {
          data.values.push([stock.open, stock.close, stock.low, stock.high]);
          data.volumes.push([stock.open, stock.close, stock.vol]);
        } else {
          // 否则生成模拟数据(在实际股票价格基础上随机波动)
          const basePrice = parseFloat(stock.close);
          const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // 上下浮动5%
          const open = (basePrice * randomFactor).toFixed(2);
          const close = (basePrice * randomFactor * (1 + (Math.random() * 0.06 - 0.03))).toFixed(2);
          const low = (Math.min(open, close) * (1 - Math.random() * 0.02)).toFixed(2);
          const high = (Math.max(open, close) * (1 + Math.random() * 0.02)).toFixed(2);
          const vol = (parseFloat(stock.vol) * (0.7 + Math.random() * 0.6)).toFixed(0);

          data.values.push([open, close, low, high]);
          data.volumes.push([open, close, vol]);
        }
      }

      // 计算MA5, MA10, MA20和MA60
      for (let i = 0; i < data.values.length; i++) {
        // MA5
        if (i >= 4) {
          const ma5Sum = data.values.slice(i - 4, i + 1).reduce((sum, item) => sum + parseFloat(item[1]), 0);
          data.ma5.push((ma5Sum / 5).toFixed(2));
        } else {
          data.ma5.push(null);
        }

        // MA10
        if (i >= 9) {
          const ma10Sum = data.values.slice(i - 9, i + 1).reduce((sum, item) => sum + parseFloat(item[1]), 0);
          data.ma10.push((ma10Sum / 10).toFixed(2));
        } else {
          data.ma10.push(null);
        }

        // MA20
        if (i >= 19) {
          const ma20Sum = data.values.slice(i - 19, i + 1).reduce((sum, item) => sum + parseFloat(item[1]), 0);
          data.ma20.push((ma20Sum / 20).toFixed(2));
        } else {
          data.ma20.push(null);
        }

        // MA60 - 由于我们只有41天数据，无法计算完整的MA60，这里使用简化版
        if (i >= 19) { // 使用可用数据计算近似值
          const ma60Sum = data.values.slice(Math.max(0, i - 39), i + 1).reduce((sum, item) => sum + parseFloat(item[1]), 0);
          const count = Math.min(i + 1, 40); // 实际数据点数量
          data.ma60.push((ma60Sum / count).toFixed(2));
        } else {
          data.ma60.push(null);
        }
      }

      // 如果是半年线或年线数据，添加相应均线
      if (currentDataType.value === 'halfYearLine' && stock.halfYearLine) {
        data.ma120 = stock.halfYearLine;
      }
      if (currentDataType.value === 'yearLine' && stock.yearLine) {
        data.ma250 = stock.yearLine;
      }

      return data;
    };

    // 渲染图表
    const renderCharts = () => {
      if (activeTab.value !== 'chart' || !stockResponse.value.stocks || stockResponse.value.stocks.length === 0) return;

      // 延迟执行，确保DOM已渲染
      setTimeout(() => {
        // 每个股票渲染一个图表
        stockResponse.value.stocks.forEach((stock, index) => {
          const chartData = prepareChartData(stock);
          if (!chartData) return;

          const chartDom = document.getElementById(`chart-${index}`);
          if (!chartDom) return;

          // 添加点击事件，点击放大查看
          chartDom.onclick = function () {
            showFullScreenChart(stock, chartData);
          };
          chartDom.style.cursor = 'pointer';

          const myChart = echarts.init(chartDom);

          const option = {
            backgroundColor: '#fff',
            animation: false,
            title: {
              text: `${stock.tsCode}`,
              subtext: `${formatDate(stock.tradeDate)} 开:${stock.open} 收:${stock.close} 涨跌:${stock.pctChg}%`,
              left: 'center',
              textStyle: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333'
              },
              subtextStyle: {
                fontSize: 12,
                color: getPriceColor(stock.pctChg)
              }
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'cross',
                lineStyle: {
                  color: '#999',
                  width: 1,
                  type: 'dashed'
                }
              },
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              textStyle: {
                color: '#000'
              },
              formatter: function (params) {
                const candlestickParams = params.filter(param => param.seriesName === 'K线')[0];
                if (!candlestickParams) return '';

                const date = candlestickParams.name;
                const open = candlestickParams.data[0];
                const close = candlestickParams.data[1];
                const low = candlestickParams.data[2];
                const high = candlestickParams.data[3];

                let color = open < close ? 'red' : open > close ? 'green' : '#999';

                let result = `<div style="font-weight: bold; margin-bottom: 4px;">${date}</div>`;
                result += `<div style="color:${color}">开盘价: ${open}</div>`;
                result += `<div style="color:${color}">收盘价: ${close}</div>`;
                result += `<div style="color:${color}">最低价: ${low}</div>`;
                result += `<div style="color:${color}">最高价: ${high}</div>`;

                // 显示均线数据
                params.forEach(param => {
                  if (param.seriesName.includes('MA')) {
                    const value = param.data;
                    if (value) {
                      result += `<div style="color:${param.color}">${param.seriesName}: ${value}</div>`;
                    }
                  }
                });

                return result;
              }
            },
            axisPointer: {
              link: [{
                xAxisIndex: 'all'
              }],
              label: {
                backgroundColor: '#777'
              }
            },
            legend: {
              data: ['K线', 'MA5', 'MA10', 'MA20', 'MA60'],
              top: 30,
              selected: {
                'MA20': false,
                'MA60': false
              },
              textStyle: {
                color: '#333'
              }
            },
            grid: [{
              left: '3%',
              right: '3%',
              top: '12%',
              height: '58%'
            }, {
              left: '3%',
              right: '3%',
              top: '75%',
              height: '15%'
            }],
            xAxis: [{
              type: 'category',
              data: chartData.categoryData,
              boundaryGap: false,
              axisLine: { lineStyle: { color: '#ccc' } },
              axisLabel: {
                show: true,
                color: '#999',
                fontSize: 10,
                formatter: function (value) {
                  return value.substring(5); // 只显示月-日
                }
              },
              splitLine: {
                show: true,
                lineStyle: {
                  color: ['#eee'],
                  type: 'dashed'
                }
              },
              min: 'dataMin',
              max: 'dataMax'
            }, {
              type: 'category',
              gridIndex: 1,
              data: chartData.categoryData,
              boundaryGap: false,
              axisLine: { lineStyle: { color: '#ccc' } },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              min: 'dataMin',
              max: 'dataMax'
            }],
            yAxis: [{
              scale: true,
              splitNumber: 4,
              axisLine: { lineStyle: { color: '#ccc' } },
              splitLine: {
                show: true,
                lineStyle: {
                  color: ['#eee'],
                  type: 'dashed'
                }
              },
              axisLabel: {
                color: '#999',
                formatter: function (value) {
                  return value.toFixed(2);
                },
                fontSize: 10
              }
            }, {
              scale: true,
              gridIndex: 1,
              splitNumber: 2,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { show: false },
              splitLine: { show: false }
            }],
            dataZoom: [{
              type: 'inside',
              xAxisIndex: [0, 1],
              start: 35,
              end: 65
            }, {
              show: true,
              xAxisIndex: [0, 1],
              type: 'slider',
              top: '92%',
              start: 35,
              end: 65,
              height: 20,
              borderColor: '#ccc',
              fillerColor: 'rgba(200,200,200,0.2)',
              handleStyle: {
                color: '#aaa'
              }
            }],
            visualMap: {
              show: false,
              seriesIndex: 3,
              dimension: 2,
              pieces: [{
                value: 1,
                color: '#FD1050'
              }, {
                value: -1,
                color: '#0CF49B'
              }]
            },
            series: [{
              name: 'K线',
              type: 'candlestick',
              data: chartData.values,
              itemStyle: {
                color: '#FD1050',
                color0: '#0CF49B',
                borderColor: '#FD1050',
                borderColor0: '#0CF49B'
              }
            }, {
              name: 'MA5',
              type: 'line',
              data: chartData.ma5,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1,
                color: '#DA9D54'
              }
            }, {
              name: 'MA10',
              type: 'line',
              data: chartData.ma10,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1,
                color: '#39AAFD'
              }
            }, {
              name: 'MA20',
              type: 'line',
              data: chartData.ma20,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1,
                color: '#B833FF'
              }
            }, {
              name: 'MA60',
              type: 'line',
              data: chartData.ma60,
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1,
                color: '#29C77E'
              }
            }, {
              name: '成交量',
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: chartData.volumes,
              itemStyle: {
                color: function (params) {
                  const [open, close] = params.data;
                  return close >= open ? '#FD1050' : '#0CF49B';
                }
              }
            }]
          };

          // 如果有半年线数据，添加到图表中
          if (chartData.ma120) {
            const maName = '半年线';
            option.series.push({
              name: maName,
              type: 'line',
              data: Array(chartData.categoryData.length).fill(chartData.ma120),
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1.5,
                color: '#F4A225',
                type: 'dashed'
              }
            });
            option.legend.data.push(maName);
          }

          // 如果有年线数据，添加到图表中
          if (chartData.ma250) {
            const maName = '年线';
            option.series.push({
              name: maName,
              type: 'line',
              data: Array(chartData.categoryData.length).fill(chartData.ma250),
              smooth: true,
              showSymbol: false,
              lineStyle: {
                width: 1.5,
                color: '#E165FD',
                type: 'dashed'
              }
            });
            option.legend.data.push(maName);
          }

          myChart.setOption(option);

          // 保存图表实例，以便后续更新
          window.addEventListener('resize', () => {
            myChart.resize();
          });
        });
      }, 100); // 给DOM渲染一些时间
    };

    // 获取价格颜色
    const getPriceColor = (pctChg) => {
      if (!pctChg && pctChg !== 0) return '#999';
      const value = parseFloat(pctChg);
      return value > 0 ? '#FD1050' : value < 0 ? '#0CF49B' : '#999';
    };

    // 显示全屏图表
    const showFullScreenChart = (stock, chartData) => {
      // 创建模态框
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';

      // 创建关闭按钮
      const closeBtn = document.createElement('div');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '20px';
      closeBtn.style.right = '20px';
      closeBtn.style.fontSize = '30px';
      closeBtn.style.color = '#fff';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = function () {
        document.body.removeChild(modal);
      };

      // 创建标题
      const title = document.createElement('div');
      title.innerText = `${stock.tsCode} ${formatDate(stock.tradeDate)} 开:${stock.open} 收:${stock.close} 涨跌:${stock.pctChg}%`;
      title.style.color = '#fff';
      title.style.marginBottom = '10px';
      title.style.fontSize = '18px';

      // 创建图表容器
      const chartContainer = document.createElement('div');
      chartContainer.style.width = '90%';
      chartContainer.style.height = '80%';
      chartContainer.style.backgroundColor = '#fff';
      chartContainer.style.borderRadius = '5px';

      modal.appendChild(closeBtn);
      modal.appendChild(title);
      modal.appendChild(chartContainer);
      document.body.appendChild(modal);

      // 渲染图表
      const fullChart = echarts.init(chartContainer);

      const option = {
        backgroundColor: '#fff',
        animation: false,
        title: {
          text: `${stock.tsCode}`,
          subtext: `${formatDate(stock.tradeDate)} 开:${stock.open} 收:${stock.close} 涨跌:${stock.pctChg}%`,
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333'
          },
          subtextStyle: {
            fontSize: 14,
            color: getPriceColor(stock.pctChg)
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            lineStyle: {
              color: '#999',
              width: 1,
              type: 'dashed'
            }
          },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          textStyle: {
            color: '#000'
          },
          formatter: function (params) {
            const candlestickParams = params.filter(param => param.seriesName === 'K线')[0];
            if (!candlestickParams) return '';

            const date = candlestickParams.name;
            const open = candlestickParams.data[0];
            const close = candlestickParams.data[1];
            const low = candlestickParams.data[2];
            const high = candlestickParams.data[3];

            let color = open < close ? 'red' : open > close ? 'green' : '#999';

            let result = `<div style="font-weight: bold; margin-bottom: 4px;">${date}</div>`;
            result += `<div style="color:${color}">开盘价: ${open}</div>`;
            result += `<div style="color:${color}">收盘价: ${close}</div>`;
            result += `<div style="color:${color}">最低价: ${low}</div>`;
            result += `<div style="color:${color}">最高价: ${high}</div>`;

            // 显示均线数据
            params.forEach(param => {
              if (param.seriesName.includes('MA')) {
                const value = param.data;
                if (value) {
                  result += `<div style="color:${param.color}">${param.seriesName}: ${value}</div>`;
                }
              }
            });

            return result;
          }
        },
        axisPointer: {
          link: [{
            xAxisIndex: 'all'
          }],
          label: {
            backgroundColor: '#777'
          }
        },
        legend: {
          data: ['K线', 'MA5', 'MA10', 'MA20', 'MA60'],
          top: 50,
          textStyle: {
            color: '#333'
          }
        },
        grid: [{
          left: '3%',
          right: '3%',
          top: '12%',
          height: '60%'
        }, {
          left: '3%',
          right: '3%',
          top: '77%',
          height: '15%'
        }],
        xAxis: [{
          type: 'category',
          data: chartData.categoryData,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#ccc' } },
          axisLabel: {
            show: true,
            color: '#333',
            formatter: function (value) {
              return value; // 全屏时显示完整日期
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
              type: 'dashed'
            }
          },
          min: 'dataMin',
          max: 'dataMax'
        }, {
          type: 'category',
          gridIndex: 1,
          data: chartData.categoryData,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#ccc' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }],
        yAxis: [{
          scale: true,
          splitNumber: 4,
          axisLine: { lineStyle: { color: '#ccc' } },
          splitLine: {
            show: true,
            lineStyle: {
              color: ['#eee'],
              type: 'dashed'
            }
          },
          axisLabel: {
            color: '#333',
            formatter: function (value) {
              return value.toFixed(2);
            }
          }
        }, {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            show: true,
            color: '#333',
            formatter: function (value) {
              return (value / 10000).toFixed(0) + '万';
            }
          },
          splitLine: { show: false }
        }],
        dataZoom: [{
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100
        }, {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '95%',
          start: 0,
          end: 100,
          height: 20,
          borderColor: '#ccc',
          fillerColor: 'rgba(200,200,200,0.2)',
          handleStyle: {
            color: '#aaa'
          }
        }],
        visualMap: {
          show: false,
          seriesIndex: 5,
          dimension: 2,
          pieces: [{
            value: 1,
            color: '#FD1050'
          }, {
            value: -1,
            color: '#0CF49B'
          }]
        },
        series: [{
          name: 'K线',
          type: 'candlestick',
          data: chartData.values,
          itemStyle: {
            color: '#FD1050',
            color0: '#0CF49B',
            borderColor: '#FD1050',
            borderColor0: '#0CF49B'
          }
        }, {
          name: 'MA5',
          type: 'line',
          data: chartData.ma5,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#DA9D54'
          }
        }, {
          name: 'MA10',
          type: 'line',
          data: chartData.ma10,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#39AAFD'
          }
        }, {
          name: 'MA20',
          type: 'line',
          data: chartData.ma20,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#B833FF'
          }
        }, {
          name: 'MA60',
          type: 'line',
          data: chartData.ma60,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#29C77E'
          }
        }, {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: chartData.volumes,
          itemStyle: {
            color: function (params) {
              const [open, close] = params.data;
              return close >= open ? '#FD1050' : '#0CF49B';
            }
          }
        }]
      };

      // 如果有半年线数据，添加到图表中
      if (chartData.ma120) {
        const maName = '半年线';
        option.series.push({
          name: maName,
          type: 'line',
          data: Array(chartData.categoryData.length).fill(chartData.ma120),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1.5,
            color: '#F4A225',
            type: 'dashed'
          }
        });
        option.legend.data.push(maName);
      }

      // 如果有年线数据，添加到图表中
      if (chartData.ma250) {
        const maName = '年线';
        option.series.push({
          name: maName,
          type: 'line',
          data: Array(chartData.categoryData.length).fill(chartData.ma250),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1.5,
            color: '#E165FD',
            type: 'dashed'
          }
        });
        option.legend.data.push(maName);
      }

      fullChart.setOption(option);

      // 处理窗口大小变化
      window.addEventListener('resize', () => {
        fullChart.resize();
      });
    };

    // Tab变化时重新渲染图表
    const handleTabChange = (tab) => {
      activeTab.value = tab.props.name;
      if (tab.props.name === 'chart') {
        renderCharts();
      }
    };

    // 生命周期钩子
    onMounted(() => {
      loadData();

      // 更新当前日期
      setInterval(() => {
        currentDate.value = new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      }, 60000); // 每分钟更新一次
    });

    return {
      searchForm,
      stockResponse,
      currentPage,
      pageSize,
      loading,
      activeTab,
      currentDataType,
      positiveRate,
      negativeRate,
      currentDate,
      formatDate,
      getPriceChangeClass,
      loadData,
      loadLimitUpData,
      loadLimitDownData,
      loadHalfYearLineData,
      loadYearLineData,
      handlePageChange,
      resetForm,
      handleTabChange
    };
  }
};

// 创建Vue应用实例并挂载
const app = createApp(App);

// 全局配置Element Plus
app.use(ElementPlus, {
  locale: ElementPlusLocaleZhCn, // 使用中文语言包
});

app.mount('#app'); 