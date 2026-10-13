import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = '@meu-controle-financeiro/movimentacoes-v1';
const CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Outros'];
const COLORS = {
  bg: '#F5F7F4', surface: '#FFFFFF', ink: '#18221D', muted: '#758079',
  green: '#16794B', greenLight: '#E6F4EC', red: '#C94E4E', redLight: '#FCECEC',
  line: '#E8ECE8', navy: '#193B2D', lime: '#C6ED8B',
};
const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const dateValue = (value) => {
  const m = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 0;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.getTime() : 0;
};
const freshForm = () => ({ description: '', amount: '', type: 'Despesa', category: 'Alimentação', date: today() });

function Pill({ label, selected, onPress, tint }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && (tint === 'red' ? styles.pillRed : styles.pillSelected)]}>
      <Text style={[styles.pillText, selected && (tint === 'red' ? styles.pillTextRed : styles.pillTextSelected)]}>{label}</Text>
    </Pressable>
  );
}
function SummaryCard({ title, amount, type }) {
  const color = type === 'expense' ? COLORS.red : type === 'balance' ? COLORS.ink : COLORS.green;
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHead}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <View style={[styles.summaryDot, { backgroundColor: color }]} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.summaryAmount, { color }]}>{money(amount)}</Text>
    </View>
  );
}
function MovementRow({ item, onPress }) {
  const income = item.type === 'Receita';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.movementRow, pressed && { opacity: 0.72 }]}>
      <View style={[styles.movementIcon, { backgroundColor: income ? COLORS.greenLight : COLORS.redLight }]}>
        <Text style={{ fontSize: 19, color: income ? COLORS.green : COLORS.red }}>{income ? '↙' : '↗'}</Text>
      </View>
      <View style={styles.movementInfo}>
        <Text style={styles.movementTitle} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.movementMeta}>{item.category} · {item.date}</Text>
      </View>
      <Text style={[styles.movementValue, { color: income ? COLORS.green : COLORS.ink }]}>
        {income ? '+' : '−'} {money(item.amount)}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [query, setQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(freshForm());

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => { if (raw) setItems(JSON.parse(raw)); })
      .catch(() => Alert.alert('Ops', 'Não foi possível carregar seus dados salvos.'))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORE_KEY, JSON.stringify(items)).catch(() => Alert.alert('Ops', 'Não foi possível salvar os dados no aparelho.'));
  }, [items, loaded]);

  const totals = useMemo(() => items.reduce((sum, item) => {
    const n = Number(item.amount) || 0;
    if (item.type === 'Receita') sum.income += n; else sum.expenses += n;
    return sum;
  }, { income: 0, expenses: 0 }), [items]);
  const filteredItems = useMemo(() => items
    .filter((item) => typeFilter === 'Todas' || item.type === typeFilter)
    .filter((item) => categoryFilter === 'Todas' || item.category === categoryFilter)
    .filter((item) => item.description.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => dateValue(b.date) - dateValue(a.date) || b.createdAt - a.createdAt),
  [items, typeFilter, categoryFilter, query]);

  const openNew = () => { setEditingId(null); setForm(freshForm()); setFormVisible(true); };
  const openEdit = (item) => {
    setDetailItem(null); setEditingId(item.id);
    setForm({ description: item.description, amount: String(item.amount).replace('.', ','), type: item.type, category: item.category, date: item.date });
    setFormVisible(true);
  };
  const save = () => {
    const description = form.description.trim();
    if (!description) return Alert.alert('Campo obrigatório', 'Informe a descrição da movimentação.');
    if (!form.amount.trim()) return Alert.alert('Campo obrigatório', 'Informe o valor da movimentação.');
    const rawAmount = form.amount.trim();
    const amount = Number(rawAmount.includes(',') ? rawAmount.replace(/\./g, '').replace(',', '.') : rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
    if (!form.type) return Alert.alert('Campo obrigatório', 'Selecione receita ou despesa.');
    if (!form.category) return Alert.alert('Campo obrigatório', 'Selecione uma categoria.');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.date) || !dateValue(form.date)) return Alert.alert('Data inválida', 'Informe a data no formato DD/MM/AAAA.');
    const record = { id: editingId || `${Date.now()}-${Math.random()}`, description, amount, type: form.type, category: form.category, date: form.date, createdAt: Date.now() };
    setItems((previous) => editingId ? previous.map((x) => x.id === editingId ? { ...x, ...record, createdAt: x.createdAt } : x) : [record, ...previous]);
    setFormVisible(false);
  };
  const confirmDelete = (item) => Alert.alert('Excluir movimentação?', 'Esta ação não pode ser desfeita.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => { setItems((prev) => prev.filter((x) => x.id !== item.id)); setDetailItem(null); } },
  ]);
  const detail = detailItem && items.find((x) => x.id === detailItem.id);

  if (!loaded) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.green} /><Text style={styles.loadingText}>Carregando suas finanças…</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.topbar}>
        <View><Text style={styles.eyebrow}>Bem Vindo!</Text><Text style={styles.brand}>Meu dinheiro<Text style={{ color: COLORS.blue }}>.</Text></Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>R$</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO ATUAL</Text>
          <Text style={styles.balanceAmount}>{money(totals.income - totals.expenses)}</Text>
          <Text style={styles.balanceCaption}>Seu resumo financeiro</Text>
          <View style={styles.balanceDecoration}><Text style={styles.balanceDecorationText}>↗</Text></View>
        </View>
        <View style={styles.summaryGrid}>
          <SummaryCard title="Receitas" amount={totals.income} type="income" />
          <SummaryCard title="Despesas" amount={totals.expenses} type="expense" />
        </View>
        <View style={styles.listHeading}>
          <View><Text style={styles.sectionTitle}>Movimentações</Text><Text style={styles.sectionSub}>{filteredItems.length} registro{filteredItems.length === 1 ? '' : 's'}</Text></View>
          <Pressable onPress={openNew} style={styles.addButton}><Text style={styles.addPlus}>＋</Text><Text style={styles.addLabel}>Nova</Text></Pressable>
        </View>
        <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar movimentação" placeholderTextColor="#929B95" style={styles.searchInput} returnKeyType="search" /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {['Todas', 'Receita', 'Despesa'].map((f) => <Pill key={f} label={f === 'Receita' ? 'Receitas' : f === 'Despesa' ? 'Despesas' : f} selected={typeFilter === f} tint={f === 'Despesa' ? 'red' : 'green'} onPress={() => setTypeFilter(f)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {['Todas', ...CATEGORIES].map((c) => <Pill key={c} label={c} selected={categoryFilter === c} onPress={() => setCategoryFilter(c)} />)}
        </ScrollView>
        <View style={styles.listCard}>
          {filteredItems.length ? filteredItems.map((item) => <MovementRow key={item.id} item={item} onPress={() => setDetailItem(item)} />) : (
            <View style={styles.emptyState}><Text style={styles.emptyIcon}>＋</Text><Text style={styles.emptyTitle}>{items.length ? 'Nenhum resultado' : 'Tudo começa por aqui'}</Text><Text style={styles.emptyText}>{items.length ? 'Tente mudar os filtros ou a pesquisa.' : 'Adicione sua primeira receita ou despesa para acompanhar seu saldo.'}</Text>{!items.length && <Pressable onPress={openNew}><Text style={styles.emptyLink}>Adicionar movimentação →</Text></Pressable>}</View>
          )}
        </View>
        <Text style={styles.footer}>Seus dados ficam salvos neste aparelho.</Text>
      </ScrollView>

      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}><Pressable onPress={() => setFormVisible(false)}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Text style={styles.modalTitle}>{editingId ? 'Editar movimentação' : 'Nova movimentação'}</Text><View style={{ width: 56 }} /></View>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={styles.typeRow}><Pressable onPress={() => setForm({ ...form, type: 'Despesa' })} style={[styles.typeButton, form.type === 'Despesa' && styles.typeExpense]}><Text style={[styles.typeButtonText, form.type === 'Despesa' && styles.typeTextActive]}>↗  Despesa</Text></Pressable><Pressable onPress={() => setForm({ ...form, type: 'Receita' })} style={[styles.typeButton, form.type === 'Receita' && styles.typeIncome]}><Text style={[styles.typeButtonText, form.type === 'Receita' && styles.typeIncomeText]}>↙  Receita</Text></Pressable></View>
              <Text style={styles.fieldLabel}>Descrição</Text><TextInput value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Ex.: Supermercado" style={styles.input} maxLength={60} />
              <Text style={styles.fieldLabel}>Valor</Text><View style={styles.amountInputWrap}><Text style={styles.currencyPrefix}>R$</Text><TextInput value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v.replace(/[^\d,.]/g, '') })} placeholder="0,00" style={styles.amountInput} keyboardType="decimal-pad" /></View>
              <Text style={styles.fieldLabel}>Categoria</Text><View style={styles.categoryChoices}>{CATEGORIES.map((c) => <Pill key={c} label={c} selected={form.category === c} onPress={() => setForm({ ...form, category: c })} />)}</View>
              <Text style={styles.fieldLabel}>Data</Text><TextInput value={form.date} onChangeText={(v) => setForm({ ...form, date: v.replace(/[^\d/]/g, '').slice(0, 10) })} placeholder="DD/MM/AAAA" style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} />
              <Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveButtonText}>{editingId ? 'Salvar alterações' : 'Salvar movimentação'}</Text></Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!detail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailItem(null)}>
        <SafeAreaView style={styles.modalSafe}>
          {detail && <View style={{ flex: 1 }}>
            <View style={styles.modalHeader}><Pressable onPress={() => setDetailItem(null)}><Text style={styles.cancelText}>Fechar</Text></Pressable><Text style={styles.modalTitle}>Detalhes</Text><View style={{ width: 45 }} /></View>
            <View style={styles.detailContent}>
              <View style={[styles.detailIcon, { backgroundColor: detail.type === 'Receita' ? COLORS.greenLight : COLORS.redLight }]}><Text style={{ fontSize: 28, color: detail.type === 'Receita' ? COLORS.green : COLORS.red }}>{detail.type === 'Receita' ? '↙' : '↗'}</Text></View>
              <Text style={styles.detailDesc}>{detail.description}</Text><Text style={[styles.detailAmount, { color: detail.type === 'Receita' ? COLORS.green : COLORS.ink }]}>{detail.type === 'Receita' ? '+' : '−'} {money(detail.amount)}</Text>
              <View style={styles.detailData}>{[['Tipo', detail.type], ['Categoria', detail.category], ['Data', detail.date]].map(([k, v]) => <View key={k} style={styles.detailLine}><Text style={styles.detailKey}>{k}</Text><Text style={styles.detailValue}>{v}</Text></View>)}</View>
              <View style={styles.detailButtons}><Pressable style={styles.editButton} onPress={() => openEdit(detail)}><Text style={styles.editButtonText}>Editar</Text></Pressable><Pressable style={styles.deleteButton} onPress={() => confirmDelete(detail)}><Text style={styles.deleteButtonText}>Excluir</Text></Pressable></View>
            </View>
          </View>}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },
  topbar: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  brand: { color: COLORS.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.6 },
  avatar: { width: 40, height: 40, borderRadius: 15, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.green, fontSize: 12, fontWeight: '900' },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  balanceCard: { minHeight: 160, backgroundColor: COLORS.navy, borderRadius: 24, padding: 22, overflow: 'hidden', justifyContent: 'center' },
  balanceLabel: { color: '#B8D0C2', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  balanceAmount: { color: '#FFFFFF', fontWeight: '800', fontSize: 32, letterSpacing: -1, marginTop: 8 },
  balanceCaption: { color: '#C3D7CA', fontSize: 12, marginTop: 5 },
  balanceDecoration: { position: 'absolute', right: -18, top: -25, width: 125, height: 125, borderRadius: 70, backgroundColor: '#22b676', alignItems: 'center', justifyContent: 'center' },
  balanceDecorationText: { color: COLORS.lime, fontSize: 64, fontWeight: '300', transform: [{ rotate: '8deg' }] },
  summaryGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
  summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: COLORS.line },
  summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  summaryDot: { width: 7, height: 7, borderRadius: 4 },
  summaryAmount: { fontSize: 17, fontWeight: '800', marginTop: 11 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 14 },
  sectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  sectionSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.green, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13 },
  addPlus: { color: '#FFF', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  addLabel: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  searchBox: { minHeight: 45, backgroundColor: '#FFFFFF', borderColor: COLORS.line, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  searchIcon: { color: COLORS.muted, fontSize: 24, marginRight: 7, lineHeight: 27 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.ink, paddingVertical: 9 },
  pillsRow: { gap: 8, paddingTop: 13, paddingBottom: 7 },
  categoryRow: { gap: 7, paddingBottom: 13 },
  pill: { borderWidth: 1, borderColor: COLORS.line, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 20, backgroundColor: '#FFFFFF' },
  pillSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  pillRed: { backgroundColor: COLORS.redLight, borderColor: '#F4CECE' },
  pillText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  pillTextSelected: { color: '#FFFFFF' },
  pillTextRed: { color: COLORS.red },
  listCard: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FFFFFF', paddingHorizontal: 14 },
  movementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F2F0', gap: 11 },
  movementIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  movementInfo: { flex: 1, minWidth: 0 },
  movementTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  movementMeta: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  movementValue: { fontSize: 12, fontWeight: '800' },
  emptyState: { paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' },
  emptyIcon: { width: 40, height: 40, textAlign: 'center', textAlignVertical: 'center', color: COLORS.green, fontSize: 24, backgroundColor: COLORS.greenLight, borderRadius: 14, overflow: 'hidden' },
  emptyTitle: { color: COLORS.ink, fontWeight: '800', fontSize: 14, marginTop: 12 },
  emptyText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 6 },
  emptyLink: { color: COLORS.green, fontWeight: '800', fontSize: 12, marginTop: 14 },
  footer: { color: '#9BA39E', textAlign: 'center', fontSize: 10, paddingTop: 16 },
  modalSafe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', height: 54, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: '#FFFFFF' },
  cancelText: { color: COLORS.green, fontSize: 13, fontWeight: '600' },
  modalTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  formContent: { paddingHorizontal: 20, paddingBottom: 34 },
  fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 9 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, padding: 14, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center' },
  typeExpense: { backgroundColor: COLORS.redLight, borderColor: '#F4CECE' },
  typeIncome: { backgroundColor: COLORS.greenLight, borderColor: '#CBE9D5' },
  typeButtonText: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },
  typeTextActive: { color: COLORS.red },
  typeIncomeText: { color: COLORS.green },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: COLORS.ink, fontSize: 14 },
  amountInputWrap: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  currencyPrefix: { color: COLORS.muted, fontSize: 14, fontWeight: '700', marginRight: 10 },
  amountInput: { flex: 1, paddingVertical: 13, color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  categoryChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveButton: { marginTop: 28, backgroundColor: COLORS.green, padding: 16, borderRadius: 15, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  detailContent: { padding: 24, alignItems: 'center' },
  detailIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  detailDesc: { fontSize: 21, color: COLORS.ink, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  detailAmount: { fontSize: 27, fontWeight: '800', marginTop: 8 },
  detailData: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, marginTop: 30, paddingHorizontal: 16 },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F2F0' },
  detailKey: { color: COLORS.muted, fontSize: 12 },
  detailValue: { color: COLORS.ink, fontWeight: '700', fontSize: 12 },
  detailButtons: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 18 },
  editButton: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.green },
  editButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  deleteButton: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.redLight },
  deleteButtonText: { color: COLORS.red, fontSize: 13, fontWeight: '800' },
});
