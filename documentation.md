
# EJN Gamificação Interna - Documentação do Produto

## 1. Arquitetura do Produto

### Fluxos Principais
- **Colaborador**: Dashboard (Tarefas) -> Submissão (Evidência) -> Acúmulo de Pontos -> Loja -> Resgate.
- **Gestor**: Dashboard do Time -> Fila de Aprovação -> Validar Evidência -> Criar Tarefas de Curto Prazo.
- **Admin**: Gestão de Inventário (Loja) -> Auditoria de Pontos -> Configurações de RBAC -> Relatórios CSV.

---

## 2. Modelo de Dados (Schema)

| Coleção | Campos Chave |
| :--- | :--- |
| `users` | id, email, role, team, points_balance, total_xp, level, privacy_opt_out |
| `tasks` | id, title, points, difficulty, recurrence, evidence_required, status (active/archived) |
| `submissions` | id, task_id, user_id, evidence_payload, status, reviewer_id, points_awarded |
| `rewards` | id, name, cost, stock, category, active_flag |
| `redemptions` | id, reward_id, user_id, status (requested...delivered), created_at |
| `audit_logs` | id, timestamp, actor_id, target_id, action_type, metadata_json |

---

## 3. Regras de Negócio & Anti-Fraude

1.  **Aprovação**: Pontos de tarefas com `evidence_required: true` só são injetados no balanço após aprovação manual por um Gestor ou Admin.
2.  **Limite Diário**: Cada categoria (ex: Educação) tem um teto de envios diários (ex: 2 submissões) para evitar "spam" de atividades fáceis.
3.  **Duplicidade**: O sistema bloqueia a submissão da mesma tarefa `ONCE` ou em intervalo menor que o ciclo da `recurrence`.
4.  **Estoque Atômico**: O débito de pontos e redução de estoque na loja ocorrem em uma transação única (rollback em caso de falha).
5.  **Audit Trail**: Toda alteração manual de pontos por Admin gera um log obrigatório com justificativa.

---

## 4. Roadmap de Implementação

### Semana 1: MVP Funcional
- [ ] Setup do Ambiente (React + Tailwind + Mock/Firebase).
- [ ] Auth simples e Dashboard de Tarefas.
- [ ] Fluxo de Envio de Evidência (Formulário Simples).
- [ ] Visualização da Loja de Recompensas.

### Semana 2: Gestão & Segurança
- [ ] Painel de Aprovação para Gestores.
- [ ] Lógica de Resgate com Débito de Pontos.
- [ ] Sistema de Níveis e Streak Visual.
- [ ] Auditoria (Logs de sistema).

### Fase 2: Melhorias
- [ ] Integração com Slack/Discord para notificações de aprovação.
- [ ] Gráficos de performance de times (Recharts).
- [ ] Upload real de imagens/arquivos (Firebase Storage).

---

## 5. Checklist de Lançamento (Go-Live)
1.  **Limpeza de Dados**: Remover usuários de teste.
2.  **Importação**: Subir as primeiras 20 tarefas reais da EJN.
3.  **Estoque Inicial**: Cadastrar pelo menos 5 itens na loja com estoque real.
4.  **Treinamento**: Vídeo de 2 min para gestores sobre como aprovar tarefas.
5.  **LGPD**: Incluir link para a política de dados interna no rodapé.
