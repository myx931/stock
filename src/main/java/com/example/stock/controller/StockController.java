package com.example.stock.controller;

import com.example.stock.dto.StockResponse;
import com.example.stock.service.StockService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockController {

  private final StockService stockService;

  public StockController(StockService stockService) {
    this.stockService = stockService;
  }

  @GetMapping("/data")
  public StockResponse getAllData(
      @RequestParam(required = false) String tsCode,
      @RequestParam(required = false) String tradeDate,
      @RequestParam(required = false, defaultValue = "1") Integer pageNum) {
    return stockService.getAllData(tsCode, tradeDate, pageNum);
  }

  @GetMapping("/limit-up")
  public StockResponse getLimitUpData(
      @RequestParam(required = false) String tsCode,
      @RequestParam(required = false) String tradeDate,
      @RequestParam(required = false, defaultValue = "1") Integer pageNum) {
    return stockService.getLimitUpData(tsCode, tradeDate, pageNum);
  }

  @GetMapping("/limit-down")
  public StockResponse getLimitDownData(
      @RequestParam(required = false) String tsCode,
      @RequestParam(required = false) String tradeDate,
      @RequestParam(required = false, defaultValue = "1") Integer pageNum) {
    return stockService.getLimitDownData(tsCode, tradeDate, pageNum);
  }

  @GetMapping("/half-year-line")
  public StockResponse getHalfYearLineData(
      @RequestParam(required = false) String tsCode,
      @RequestParam(required = false) String tradeDate,
      @RequestParam(required = false, defaultValue = "1") Integer pageNum) {
    return stockService.getHalfYearLineData(tsCode, tradeDate, pageNum);
  }

  @GetMapping("/year-line")
  public StockResponse getYearLineData(
      @RequestParam(required = false) String tsCode,
      @RequestParam(required = false) String tradeDate,
      @RequestParam(required = false, defaultValue = "1") Integer pageNum) {
    return stockService.getYearLineData(tsCode, tradeDate, pageNum);
  }
}