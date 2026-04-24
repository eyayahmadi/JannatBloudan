'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Users, DollarSign, FileText, Heart, Gift, Briefcase, PartyPopper, Music } from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/site/PageShell';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const eventTypes = [
  { id: 'wedding', name: 'Mariage', icon: Heart, color: 'from-pink-500 to-red-500' },
  { id: 'birthday', name: 'Anniversaire', icon: Gift, color: 'from-purple-500 to-pink-500' },
  { id: 'corporate', name: 'Entreprise', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
  { id: 'anniversary', name: 'Célébration', icon: PartyPopper, color: 'from-orange-500 to-yellow-500' },
  { id: 'other', name: 'Autre', icon: Music, color: 'from-green-500 to-emerald-500' }
];

export default function CreateEventPage() {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '',
    capacity: '',
    price: '',
    organizer: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Event created:', { ...formData, type: selectedType });
  };

  return (
    <PageShell>
      <SiteHeader backHref="/events" backLabel="Événements" />
      <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-amber-950 animate-fade-up">
            Créer un événement
          </h1>
          <p className="mt-1 text-amber-900/75">
            Planifiez votre prochaine réception avec clarté.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up [animation-delay:100ms]">
          {/* Event Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Type d'événement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {eventTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        selectedType === type.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} text-white flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 text-center">
                        {type.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'événement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de l'événement *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Mariage Dupont-Martin"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Heure de début *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Durée (heures) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="4"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    min="1"
                    max="24"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacité *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="2500"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="organizer">Organisateur</Label>
                <Input
                  id="organizer"
                  placeholder="Nom de l'organisateur"
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre événement..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Type</p>
                  <p className="font-medium">
                    {selectedType ? eventTypes.find(t => t.id === selectedType)?.name : 'Non sélectionné'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Date et heure</p>
                  <p className="font-medium">
                    {formData.date && formData.time
                      ? `${new Date(formData.date).toLocaleDateString('fr-FR')} à ${formData.time}`
                      : 'Non défini'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Capacité</p>
                  <p className="font-medium">
                    {formData.capacity ? `${formData.capacity} personnes` : 'Non défini'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Prix</p>
                  <p className="font-medium">
                    {formData.price ? `${formData.price}€` : 'Non défini'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/events">Annuler</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedType || !formData.title || !formData.date || !formData.time}
            >
              Créer l'événement
            </Button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </PageShell>
  );
}
