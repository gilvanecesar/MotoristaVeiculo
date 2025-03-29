                  control={subscriptionForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                // Primeiro atualiza o valor no formulário
                                field.onChange(date);
                                
                                // Pega o plano atual selecionado
                                const planValue = subscriptionForm.getValues("plan");
                                let endDate = new Date(date);
                                
                                if (planValue === "monthly") {
                                  endDate.setMonth(date.getMonth() + 1);
                                } else if (planValue === "annual") {
                                  endDate.setFullYear(date.getFullYear() + 1);
                                } else if (planValue === "trial") {
                                  endDate.setDate(date.getDate() + 7);
                                }
                                
                                subscriptionForm.setValue("endDate", endDate);
                              }
                            }}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>