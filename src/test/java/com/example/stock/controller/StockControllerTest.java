package com.example.stock.controller;

import com.example.stock.dto.StockResponse;
import com.example.stock.service.StockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 股票控制器测试类
 */
@WebMvcTest(StockController.class)
public class StockControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private StockService stockService;

  /**
   * 测试获取跌停股票数据接口
   */
  @Test
  public void getLimitDownDataShouldReturnJsonResponse() throws Exception {
    // 准备模拟响应
    StockResponse mockResponse = createMockResponse();

    // 配置模拟服务行为
    when(stockService.getLimitDownData(eq(null), any(), eq(1))).thenReturn(mockResponse);

    // 执行GET请求并验证结果
    mockMvc.perform(get("/api/stock/limit-down")
        .contentType(MediaType.APPLICATION_JSON))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.date").exists())
        .andExpect(jsonPath("$.stock_count").value(1))
        .andExpect(jsonPath("$.grid_data").isArray());
  }

  /**
   * 测试根据股票代码筛选数据接口
   */
  @Test
  public void getAllDataWithTsCodeShouldReturnFilteredData() throws Exception {
    // 准备模拟响应
    StockResponse mockResponse = createMockResponse();
    String testTsCode = "000001.SZ";

    // 配置模拟服务行为
    when(stockService.getAllData(eq(testTsCode), any(), eq(1))).thenReturn(mockResponse);

    // 执行GET请求并验证结果
    mockMvc.perform(get("/api/stock/data")
        .param("tsCode", testTsCode)
        .contentType(MediaType.APPLICATION_JSON))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.grid_data[0][0][0]").value(testTsCode)); // 验证返回的第一个股票代码
  }

  /**
   * 创建用于测试的模拟响应数据
   */
  private StockResponse createMockResponse() {
    StockResponse response = new StockResponse();

    // 设置基本信息
    response.setDate(LocalDate.now().toString());
    response.setPage(1);
    response.setStock_count(1);

    // 设置列名
    response.setColumn_names(Arrays.asList(
        "ts_code", "trade_date", "open", "high",
        "low", "close", "pre_close", "pct_chg", "vol", "bay"));

    // 构建股票数据
    List<List<List<Object>>> gridData = new ArrayList<>();
    List<List<Object>> stockData = new ArrayList<>();

    // 添加一只股票的三天数据
    stockData.add(Arrays.asList(
        "000001.SZ", "2023-01-03", 10.5, 10.8, 10.2, 10.6, 10.4, 1.92, 1234567, 0.0));
    stockData.add(Arrays.asList(
        "000001.SZ", "2023-01-04", 10.7, 10.9, 10.3, 10.8, 10.6, 1.89, 1345678, 0.0));
    stockData.add(Arrays.asList(
        "000001.SZ", "2023-01-05", 10.8, 11.0, 10.5, 10.9, 10.8, 0.93, 1456789, 0.0));

    gridData.add(stockData);
    response.setGrid_data(gridData);

    return response;
  }
}