function criarFormDuasChamas() {
  const form = FormApp.create('Duas Chamas — Pesquisa de Mercado 🔥🍔')
    .setDescription('Sua opinião vale um lanche! 🍔\n\nA gente tá montando a Duas Chamas e quer saber de você: o que faz uma hamburgueria ser inesquecível? Leva 3 minutinhos. 🙏')
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false);

  // ===== SEÇÃO 1: SOBRE VOCÊ =====
  form.addPageBreakItem()
    .setTitle('🧍 Pra te conhecer')
    .setHelpText('Rapidinho, prometo!');

  form.addTextItem()
    .setTitle('Nome')
    .setRequired(false);

  form.addTextItem()
    .setTitle('WhatsApp (pra mandar uma surpresa quando abrirmos 👀)')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('Idade')
    .setChoiceValues(['Menos de 18', '18-25', '26-35', '36-45', '46+'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Bairro onde mora')
    .setRequired(true);

  // ===== SEÇÃO 2: COMPORTAMENTO =====
  form.addPageBreakItem()
    .setTitle('🍔 Como você consome')
    .setHelpText('Sem julgamento, prometo 😄');

  form.addMultipleChoiceItem()
    .setTitle('Com que frequência você come hambúrguer fora?')
    .setChoiceValues(['Quase nunca', '1x por mês', '2-3x por mês', '1x por semana', 'Mais de 1x por semana'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Quando você sai pra comer fora, o que MAIS te ganha?')
    .setHelpText('Pode marcar mais de uma')
    .setChoiceValues(['Sabor da comida', 'Preço', 'Atendimento', 'Ambiente', 'Rapidez', 'Indicação de alguém'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Como você descobre lugares novos pra comer?')
    .setHelpText('Pode marcar mais de uma')
    .setChoiceValues(['Indicação de amigos', 'Influencer', 'Instagram', 'TikTok', 'Google', 'Passando na rua', 'iFood'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Você compra mais pela HISTÓRIA da marca ou pelo PRODUTO?')
    .setChoiceValues(['História', 'Produto', 'Os dois igualmente'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('Qual o primeiro nome de hamburgueria que vem na sua cabeça AGORA?')
    .setHelpText('Pode ser qualquer uma — a primeira que veio na mente')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Já deixou de voltar num restaurante? Conta rapidinho o que aconteceu')
    .setRequired(false);

  // ===== SEÇÃO 3: HAMBURGUERIA ESPECIFICAMENTE =====
  form.addPageBreakItem()
    .setTitle('🎯 Sobre hamburgueria especificamente');

  form.addCheckboxItem()
    .setTitle('O que MAIS te atrai numa hamburgueria NOVA?')
    .setHelpText('Pode marcar mais de uma')
    .setChoiceValues(['Ingredientes diferentes', 'Preço justo', 'Rapidez', 'Atendimento', 'Ambiente', 'Combos'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Você prefere COMBO PRA 2 ou montar individual?')
    .setChoiceValues(['Combo pra 2', 'Individual', 'Tanto faz'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Quanto você costuma gastar por pessoa num lanche?')
    .setChoiceValues(['Até R$ 30', 'R$ 30-50', 'R$ 50-80', 'R$ 80+'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Como prefere fazer o pedido?')
    .setChoiceValues(['Presencial', 'WhatsApp', 'iFood', 'Site próprio'])
    .setRequired(true);

  // ===== SEÇÃO 4: LANÇAMENTO =====
  form.addPageBreakItem()
    .setTitle('🚀 Sobre lançamento e mercado');

  form.addCheckboxItem()
    .setTitle('Que tipo de AÇÃO DE LANÇAMENTO te faria querer conhecer uma hamburgueria nova?')
    .setHelpText('Pode marcar mais de uma')
    .setChoiceValues(['Degustação grátis', 'Combo promocional', 'Evento ou festa', 'Sorteio', 'Parceria com influencer'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('O que você acha que FALTA hoje no mercado de hambúrguer da sua região?')
    .setRequired(false);

  // ===== SEÇÃO 5: AVALIAÇÃO DA DEGUSTAÇÃO =====
  form.addPageBreakItem()
    .setTitle('✨ Sua avaliação da Duas Chamas')
    .setHelpText('Só responde se você participou da degustação hoje!');

  form.addScaleItem()
    .setTitle('De 0 a 10, o quanto você recomendaria a Duas Chamas pra um amigo?')
    .setBounds(0, 10)
    .setLabels('Não recomendaria', 'Recomendaria muito')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Por que essa nota? O que mais marcou?')
    .setRequired(false);

  // ===== LINKA À PLANILHA EXISTENTE =====
  const SHEET_ID = '10NOEKFAdmTzIcni-YpBMOaBCxEmTvwVh_9mpIL_qprc';
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SHEET_ID);

  // ===== LOG DOS LINKS =====
  const editUrl = form.getEditUrl();
  const publishedUrl = form.getPublishedUrl();
  const shortUrl = form.shortenFormUrl(publishedUrl);

  Logger.log('═══════════════════════════════════');
  Logger.log('✅ FORM CRIADO COM SUCESSO!');
  Logger.log('═══════════════════════════════════');
  Logger.log('📝 Editar form: ' + editUrl);
  Logger.log('🔗 Link público (compartilhar): ' + publishedUrl);
  Logger.log('🔗 Link curto: ' + shortUrl);
  Logger.log('📊 Planilha de respostas: https://docs.google.com/spreadsheets/d/' + SHEET_ID);
  Logger.log('═══════════════════════════════════');
}
