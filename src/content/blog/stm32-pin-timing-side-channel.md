---
title: A Timing Side Channel on an STM32 PIN Checker
date: 2026-11-27
summary: A 6-digit PIN checker on a Nucleo-F103RB leaks how many leading digits are correct through its own execution time. How the board is set up, how the leak is measured with the DWT cycle counter, and the constant-time fix.
tags: [embedded, side-channel, stm32]
---

Using the Nucleo board I bought, I added a few buttons to some GPIO pins to build a simple PIN verification system. The input is recorded with interrupts, and once all 6 digits have been entered, each digit is checked against the hardcoded PIN. The check looks like this:

```c
static int check_pin(const uint8_t *in, const uint8_t *pin, int n)
{
    for (int i = 0; i < n; i++)
    {
        if (in[i] != pin[i])
            return 0;
    }

    return 1;
}
```

Comparing the PIN digit by digit like this is not an unrealistic thing to write, and it already gives a good sense of how a side-channel attack works. By measuring the cycles taken by `check_pin`, an attacker can infer the length of the matching prefix. For a 6-digit PIN with 10 possible values per digit, instead of trying 10^6 combinations, at most 10 × 6 = 60 trials are needed under ideal timing conditions. In this experiment only the digits 1–4 are available, so it is at most 4 × 6 = 24.

That was the brief summary of what was done. The rest of the post goes through how the pieces were implemented, for the sake of learning more about programming a bare-metal Nucleo board.

## Initialization

The first few lines of `main` look like this:

```c
uint8_t buf[PIN_LEN];
int len = 0;

HAL_Init();
SystemClock_Config();         /* 64MHz (HSI PLL) */

__HAL_RCC_AFIO_CLK_ENABLE();
__HAL_AFIO_REMAP_SWJ_NOJTAG();

LED_Config();                 /* PA5, PC0~PC7 */
UART2_Config();
dwt_init();
Sw_EXTI_Config();

ext_leds(0);
ld2(0);
```

`HAL_Init` is for using the HAL, and then the system clock is set up. One of the pins that is dedicated to JTAG is needed as a GPIO pin for one of the switches, so JTAG has to be disabled while SWD is retained. To do that, the AFIO (Alternate Function Input/Output) clock needs to be enabled first. AFIO is the circuit that connects physical pins with other hardware features, and its clock has to be running before the remapping that releases the pin for GPIO use can be configured.

`LED_Config` is really just LED configuration (only PA5 is shown here):

```c
void LED_Config(void)
{
    GPIO_InitTypeDef gpio = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();  // RCC is Reset and Clock Control

    gpio.Pin = GPIO_PIN_5;
    gpio.Mode = GPIO_MODE_OUTPUT_PP;
    gpio.Pull = GPIO_NOPULL;
    gpio.Speed = GPIO_SPEED_FREQ_LOW;

    HAL_GPIO_Init(GPIOA, &gpio);
}
```

`UART2_Config` looks slightly more complicated:

```c
UART_HandleTypeDef UartHandle;

void UART2_Config(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    // RCC clock for GPIO and UART
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_USART2_CLK_ENABLE();

    // TX (sending data)
    GPIO_InitStruct.Pin = GPIO_PIN_2;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP; // Alternate Function Push-Pull
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;

    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    // RX (receiving data)
    GPIO_InitStruct.Pin = GPIO_PIN_3;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;

    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    // USART2 config
    UartHandle.Instance = USART2;
    UartHandle.Init.BaudRate = 9600;
    UartHandle.Init.WordLength = UART_WORDLENGTH_8B;
    UartHandle.Init.StopBits = UART_STOPBITS_1;
    UartHandle.Init.Parity = UART_PARITY_NONE;
    UartHandle.Init.Mode = UART_MODE_TX_RX;
    UartHandle.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    UartHandle.Init.OverSampling = UART_OVERSAMPLING_16;

    HAL_UART_Init(&UartHandle);
}
```

TX and RX are simply set up as an alternate-function output and a GPIO input, respectively, and the USART2 hardware uses these two pins for transmitting and receiving. USART2 uses PA2 and PA3 as its default pins, so no other configuration is needed. STM32F103 variants that expose the remapped pins also have other potential GPIO pins for USART2.

`dwt_init` initializes the DWT (Data Watchpoint and Trace) unit, which lets you count CPU cycles:

```c
static void dwt_init(void)
{
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
    DWT->CYCCNT = 0;
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
}
```

Only the cycle counter is used, and that is built into the core, so the initialization is short. `CoreDebug` points to the core debug register block, and DEMCR stands for Debug Exception and Monitor Control Register. OR-ing with `CoreDebug_DEMCR_TRCENA_Msk` (Trace Enable Mask) sets bit 24 of DEMCR, which enables the trace features, DWT included. The second line resets the counter, and the third enables it, so CYCCNT increases on every processor clock cycle while counting is enabled. The counter can overflow, but as long as a measurement is shorter than one full counter period, unsigned 32-bit subtraction still gives the correct elapsed cycle count.

## Button input with EXTI

Lastly, `Sw_EXTI_Config`:

```c
static void Sw_EXTI_Config(void)
{
    GPIO_InitTypeDef gpio = {0};

    // Enable clocks
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_AFIO_CLK_ENABLE();

    // Interrupt on falling edge, pull-up
    gpio.Mode = GPIO_MODE_IT_FALLING;
    gpio.Pull = GPIO_PULLUP;

    // SW1
    gpio.Pin = GPIO_PIN_8;
    HAL_GPIO_Init(GPIOA, &gpio);

    // SW2, SW3, SW4
    gpio.Pin = GPIO_PIN_4 |
               GPIO_PIN_5 |
               GPIO_PIN_10;
    HAL_GPIO_Init(GPIOB, &gpio);

    // Interrupt priority
    HAL_NVIC_SetPriority(EXTI4_IRQn, 2, 0);
    HAL_NVIC_SetPriority(EXTI9_5_IRQn, 2, 0);
    HAL_NVIC_SetPriority(EXTI15_10_IRQn, 2, 0);

    // Enable them
    HAL_NVIC_EnableIRQ(EXTI4_IRQn);
    HAL_NVIC_EnableIRQ(EXTI9_5_IRQn);
    HAL_NVIC_EnableIRQ(EXTI15_10_IRQn);
}
```

Notice that `gpio.Mode` is `IT_FALLING` instead of `INPUT`. In INPUT mode, the current logic level of the pin is reflected in the matching bit of IDR (Input Data Register), and the CPU has to read it manually. CRL (Control Register Low) and CRH (Control Register High) configure how each pin is used: each is 32 bits wide, with a 4-bit section per pin for 8 pins. IDR is a 32-bit register with one bit per pin in its lower 16 bits.

With `IT_FALLING`, the pin is routed through AFIO to EXTI, a hardware block connected to the NVIC (Nested Vectored Interrupt Controller). The NVIC manages interrupt requests using priorities, and enabling an NVIC IRQ is separate from enabling EXTI, so the priority is set and each relevant IRQ is enabled explicitly. An EXTI line can be mapped to the pin with that number on only one GPIO port at a time, which is also why the IRQs are named after line numbers (`EXTI4_IRQn`) rather than a port.

Now when a switch is pressed, AFIO conveys the signal to EXTI, which passes it to the NVIC. The NVIC checks pending interrupts and the IRQ's priority, and finally signals the CPU. The CPU pauses what it is doing and consults the IVT (Interrupt Vector Table, which holds the handler addresses; this is why the NVIC is called "vectored"). Depending on which IRQ fired, the CPU jumps to the matching IRQHandler, which here is:

```c
void EXTI4_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_4);
}

void EXTI9_5_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_5);
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_8);
}

void EXTI15_10_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_10);
}
```

You may wonder why another HAL function is used inside the handler. It is not strictly necessary, but it conveniently checks the PR (Pending Register). The check matters because EXTI lines 5–9 share one IRQ handler, so the handler has to find out which line actually fired. Doing it by hand would look like this (debouncing omitted):

```c
void EXTI9_5_IRQHandler(void)
{
    if (EXTI->PR & GPIO_PIN_5)
    {
        EXTI->PR = GPIO_PIN_5;
        if (sw_event == 0)
            sw_event = 3;
    }

    if (EXTI->PR & GPIO_PIN_8)
    {
        EXTI->PR = GPIO_PIN_8;
        if (sw_event == 0)
            sw_event = 1;
    }
}
```

With only 4 switches the HAL may seem redundant, but it is good practice. The callback it ends up calling:

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    uint8_t ev;

    switch (GPIO_Pin)
    {
        case GPIO_PIN_8:
            ev = 1;
            break;

        case GPIO_PIN_4:
            ev = 2;
            break;

        case GPIO_PIN_5:
            ev = 3;
            break;

        case GPIO_PIN_10:
            ev = 4;
            break;

        default:
            return;
    }
    // This identifies which event occurred

    // Debouncing
    uint32_t now = HAL_GetTick();
    uint8_t idx = ev - 1;

    if (now - last_tick[idx] < DEBOUNCE_MS)
        return;

    last_tick[idx] = now;

    if (sw_event == 0)
        sw_event = ev;
}
```

After identifying the event and checking the debounce window, if `sw_event` is zero (no pending event), it is set to the event number. `sw_event` is a global variable, and `take_event` shows how it is consumed:

```c
static uint8_t take_event(void)
{
    uint32_t primask = __get_PRIMASK();

    __disable_irq();

    uint8_t ev = sw_event;
    sw_event = 0;

    __set_PRIMASK(primask);

    return ev;
}
```

This function grabs the pending event. PRIMASK is a Cortex-M3 register: when it is 0 the CPU accepts enabled interrupts, and when it is 1 it blocks configurable-priority exceptions, ordinary interrupts included. Reading and clearing the flag is a critical section, so IRQs are disabled manually around it. Since it is not known whether IRQs were already disabled by the caller, the previous PRIMASK value is saved first and restored afterwards, instead of unconditionally re-enabling interrupts.

`take_event` is used in `main` like this:

```c
while (1)
{
    uint8_t ev = take_event();

    if (ev >= 1 && ev <= 4)
    {
        buf[len++] = ev;
        show_progress(len);

        if (len == PIN_LEN)
        {
            run_attempt(buf);
            len = 0;
        }
    }
}
```

`main` effectively polls for events through `take_event`, and the event number is the digit that was entered. Once `len` reaches `PIN_LEN`, the PIN check runs.

## Measuring the leak

The check itself is the `check_pin` shown at the top. To demonstrate the attack, `run_attempt()` verifies the PIN and reports the result along with the cycle count:

```c
static void run_attempt(const uint8_t *input)
{
    int ok;

    uint32_t cycles = measure(input, &ok);

    printf(
        "PIN: %d%d%d%d%d%d | %s | %lu cycles\r\n",
        input[0],
        input[1],
        input[2],
        input[3],
        input[4],
        input[5],
        ok ? "OPEN" : "DENY",
        (unsigned long)cycles
    );

    feedback(ok);
}
```

`fputc` is retargeted so that `printf` transmits through the UART handler:

```c
int fputc(int ch, FILE *f)
{
    (void)f;

    uint8_t c = (uint8_t)ch;

    if (HAL_UART_Transmit(&UartHandle, &c, 1, 10)
        != HAL_OK)
        return EOF;

    return (int)c;
}
```

The `measure` function does the verification while counting cycles:

```c
static uint32_t measure(const uint8_t *input,
                        int *result)
{
    uint32_t t0, t1;
    int r;

    uint32_t primask = __get_PRIMASK();

    // Disable IRQs for the measurement
    __disable_irq();

    __DSB();
    // Data Synchronization Barrier: waits for prior explicit memory accesses to complete
    __ISB();
    // Instruction Synchronization Barrier: flushes the pipeline for a cleaner measurement

    t0 = DWT->CYCCNT;

    __asm volatile("" ::: "memory");

    r = check_fn(input, secret, PIN_LEN); // PIN verification

    __asm volatile("" ::: "memory");

    t1 = DWT->CYCCNT;

    // Measurement ends

    __set_PRIMASK(primask);

    sink = r;

    *result = r;

    return t1 - t0;
}
```

Cycles are read from the DWT before and after `check_fn`. IRQs are disabled for the duration so a button interrupt cannot land in the middle of the comparison, and the empty `asm volatile` statements keep the compiler from moving the check across the two reads. By watching the cycle count printed over UART, an attacker can see it grow with every additional correct digit from the start of the PIN: guess the first digit by trying each of the four values and keeping the one that is slowest, then move on to the second digit, and so on.

## The fix

For secure coding, compare every digit regardless of whether an earlier one already differed, and only look at the accumulated difference at the end:

```c
static int check_pin(const uint8_t *in,
                     const uint8_t *pin,
                     int n)
{
    uint8_t diff = 0;

    for (int i = 0; i < n; i++)
    {
        diff |= (uint8_t)(in[i] ^ pin[i]);
    }

    return diff == 0;
}
```

Whether this actually runs in constant time still needs to be verified at the machine-code level, because the compiler is free to rewrite it into something with an early exit.

From this post, an STM32F103 implementation for a side-channel experiment was analyzed, and the more fundamental parts of how it is built were introduced.
