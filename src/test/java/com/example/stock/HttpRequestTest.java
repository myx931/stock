package com.example.stock;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 股票数据API的HTTP请求测试
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class HttpRequestTest {

  @LocalServerPort
  private int port;

  @Autowired
  private TestRestTemplate restTemplate;

  /**
   * 测试获取所有股票数据接口
   */
  @Test
  public void getAllDataShouldReturnStockData() {
    String url = "http://localhost:" + port + "/api/stock/data";
    ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

    // 验证响应状态码为200
    assertThat(response.getStatusCodeValue()).isEqualTo(200);

    // 验证响应包含预期的字段
    String responseBody = response.getBody();
    assertThat(responseBody).contains("column_names");
    assertThat(responseBody).contains("date");
    assertThat(responseBody).contains("grid_data");
    assertThat(responseBody).contains("stock_count");

    System.out.println("获取股票数据接口响应:\n" + responseBody);
  }

  /**
   * 测试获取涨停股票数据接口，并指定日期参数
   */
  @Test
  public void getLimitUpDataWithDateShouldReturnFilteredData() {
    // 指定查询日期
    String tradeDate = "2023-01-05"; // 根据实际数据修改日期
    String url = "http://localhost:" + port + "/api/stock/limit-up?tradeDate=" + tradeDate;

    ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

    // 验证响应状态码为200
    assertThat(response.getStatusCodeValue()).isEqualTo(200);

    // 验证响应包含正确的日期
    String responseBody = response.getBody();
    assertThat(responseBody).contains(tradeDate);

    System.out.println("获取涨停数据接口响应(日期=" + tradeDate + "):\n" + responseBody);
  }
}